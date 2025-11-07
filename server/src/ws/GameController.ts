import { Action } from "../../../shared/actions";
import { onConnect, socketController, event, onDisconnect } from "./ws-utils/main";
import { Socket, Server as SocketServer } from "socket.io";
import { verifyPlayerToken } from "../auth/utils";
import { inject } from "inversify";
import GameService from "../app/GameService";
import { DieFace, GameCode, PlayerId } from "../../../shared/types";
import { isErr } from "../../../shared/Result";
import { errorMessage } from "../../../shared/errors";

@socketController()
export class GameController {
    constructor(@inject("GameService") private gameService: GameService, @inject("SocketServer") private io: SocketServer) {}

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
        // Handle claim action
        const claimResult = this.gameService.makeClaim(data.gameCode, data.playerId, data.faceValue, data.quantity);
        if (isErr(claimResult)) {
            throw new Error(errorMessage(claimResult.error));
        }
        this.io.to(data.gameCode).emit(Action.CLAIM, { playerId: data.playerId, faceValue: data.faceValue, quantity: data.quantity });
    }

    @event(Action.CHALLENGE)
    handleChallenge(socket: Socket, data: {gameCode: GameCode, playerId: PlayerId}) {
        // Handle challenge action
        const challengeResult = this.gameService.makeChallenge(data.gameCode, data.playerId);
        if (isErr(challengeResult)) {
            throw new Error(errorMessage(challengeResult.error));
        }
        this.io.to(data.gameCode).emit(Action.CHALLENGE, challengeResult.value);
    }

    // TODO: handle errors better
    @event(Action.START_GAME)
    handleStartGame(socket: Socket, data: {gameCode: GameCode, startingPlayerId: PlayerId}) {
        const startGameResult = this.gameService.startGame(data.gameCode, data.startingPlayerId); 
        if (isErr(startGameResult)) {
            throw new Error(errorMessage(startGameResult.error));
        }
    }
    
    @event(Action.START_ROUND)
    handleStartRound(socket: Socket, data: any) {
        const startRoundResult = this.gameService.startRound(data.gameCode, data.startingPlayerId);
        if (isErr(startRoundResult)) {
            throw new Error(errorMessage(startRoundResult.error));
        }
    }
}