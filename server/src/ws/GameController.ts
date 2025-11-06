import { Action } from "../../../shared/actions";
import { onConnect, socketController, event } from "./ws-utils/main";
import { Socket } from "socket.io";
import { verifyPlayerToken } from "../auth/utils";

@socketController()
export class GameController {
    constructor() {}

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

        payload.gameCode

    }

    @event(Action.CLAIM)
    handleClaim(socket: Socket, data: any) {
        // Handle claim action
    }
    @event(Action.CHALLENGE)
    handleChallenge(socket: Socket, data: any) {
        // Handle challenge action
    }
    @event(Action.START_GAME)
    handleStartGame(socket: Socket, data: any) {
        // Handle start game action
    }
    @event(Action.START_ROUND)
    handleStartRound(socket: Socket, data: any) {
        // Handle start round action
    }
}