import { Action } from "../../../shared/actions";
import { socketController, socketEvent } from "./WSEvents";

@socketController()
export class GameMessageController {
    @socketEvent(Action.CLAIM)
    handleClaim(socket: any, data: any) {
        // Handle claim action
    }
    @socketEvent(Action.CHALLENGE)
    handleChallenge(socket: any, data: any) {
        // Handle challenge action
    }
    @socketEvent(Action.START_GAME)
    handleStartGame(socket: any, data: any) {
        // Handle start game action
    }
    @socketEvent(Action.START_ROUND)
    handleStartRound(socket: any, data: any) {
        // Handle start round action
    }
}