import { Action } from "../../../shared/actions";
import { onConnect, socketController, event } from "./ws-utils/main";
import { Socket, Server as SocketServer } from "socket.io";
import { verifyPlayerToken } from "../auth/utils";
import { inject } from "inversify";
import GameService from "../app/GameService";
import { GameCode, PlayerId } from "../../../shared/types";
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

        this.gameService.addPlayerConnection(payload.playerId, payload.gameCode, socket.id);
    }

    @event(Action.CLAIM)
    handleClaim(socket: Socket, data: any) {
        // Handle claim action
    }
    @event(Action.CHALLENGE)
    handleChallenge(socket: Socket, data: {gameCode: GameCode, playerId: PlayerId}) {
        // Handle challenge action
        const challengeResult = this.gameService.makeChallenge(data.gameCode, data.playerId);
        if (isErr(challengeResult)) {
            throw new Error(errorMessage(challengeResult.error));
        }
        const { winnerId, loserId, loserOut } = challengeResult.value;


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