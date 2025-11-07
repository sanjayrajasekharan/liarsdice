import { Action } from "../../../shared/actions";
import { StateChange } from "../../../shared/states";
import { onConnect, socketController, event, onDisconnect } from "./socket-utils/main";
import { Socket, Server as SocketServer } from "socket.io";
import { verifyPlayerToken } from "../auth/utils";
import { inject } from "inversify";
import GameService from "../app/GameService";
import { DieFace, GameCode, PlayerId } from "../../../shared/types";
import { isErr } from "../../../shared/Result";
import { errorMessage } from "../../../shared/errors";
import Store from "../app/Store";
import SocketController from "./socket-utils/SocketController";

@socketController()
export class GameController extends SocketController {
    constructor(@inject("GameService") private gameService: GameService, @inject("SocketServer") private io: SocketServer) {
        super();
    }

    // TODO: need to send joining and disconnecting players during pre game stage   
    // TODO: need to all players of state change
    @onConnect()
    handleConnect(socket: Socket) {
        const token = socket.handshake.query.token;
        if (!token) {
            socket.disconnect(true);
            return;
        }

        const payload = verifyPlayerToken(String(token));
        if (!payload) {
            socket.disconnect(true);
            return;
        }

        socket.join(payload.gameCode);
        socket.join(payload.playerId);
    }

    @event(Action.CLAIM)
    handleClaim(socket: Socket, data: {gameCode: GameCode, playerId: PlayerId, faceValue: DieFace, quantity: number}) {
        const claimResult = this.gameService.makeClaim(data.gameCode, data.playerId, data.faceValue, data.quantity);
        if (isErr(claimResult)) {
            throw new Error(errorMessage(claimResult.error));
        }
        this.io.to(data.gameCode).emit(Action.CLAIM, { playerId: data.playerId, faceValue: data.faceValue, quantity: data.quantity });
    }

    @event(Action.CHALLENGE)
    handleChallenge(socket: Socket, data: {gameCode: GameCode, playerId: PlayerId}) {
        const challengeResult = this.gameService.makeChallenge(data.gameCode, data.playerId);
        if (isErr(challengeResult)) {
            throw new Error(errorMessage(challengeResult.error));
        }
        this.io.to(data.gameCode).emit(StateChange.CHALLENGE_MADE, challengeResult.value);

    }

    // TODO: handle errors better
    @event(Action.START_GAME)
    handleStartGame(socket: Socket, data: {gameCode: GameCode, playerId: PlayerId}) {
        console.log("Start game event received");
        const startGameResult = this.gameService.startGame(data.gameCode, data.playerId); 
        if (isErr(startGameResult)) {
            console.log("Error starting game:", startGameResult.error);
            throw new Error(errorMessage(startGameResult.error));
        }
        const {startingPlayerId, dice} = startGameResult.value;
        this.io.to(data.gameCode).emit(StateChange.GAME_STARTED, { startingPlayerId });
        console.log(JSON.stringify(dice));
        for (const [playerId, playerDice] of Object.entries(dice)) {
            this.io.to(playerId).emit(StateChange.DICE_ROLLED, { dice: playerDice });
        }
    }

    @event(Action.START_ROUND)
    handleStartRound(socket: Socket, data: {gameCode: GameCode, playerId: PlayerId}) {
        const startRoundResult = this.gameService.startRound(data.gameCode, data.playerId);
        if (isErr(startRoundResult)) {
            throw new Error(errorMessage(startRoundResult.error));
        }
        const {startingPlayerId, dice} = startRoundResult.value;
        this.io.to(data.gameCode).emit(Action.START_ROUND, { startingPlayerId });
        
        for (const [playerId, playerDice] of Object.entries(dice)) {
            this.io.to(playerId).emit(StateChange.DICE_ROLLED, { dice: playerDice });
        }
    }
}