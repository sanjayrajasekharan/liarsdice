import WebSocket from 'ws';
import { Action } from '../../../shared/actions.js';

export default class Router {
    static connect(ws: WebSocket) {
        // Connnection logic here
    }
    static disconnect(ws: WebSocket) {
        // Disconnection logic here
    }
    
    // TODO: Define message type
    static route(ws: WebSocket, message: any) {
        // validate message structure
        // validate player/game state

        // Routing logic here

        switch (message.action) {
            case Action.CLAIM:
                // claim logic
                // Game.makeClaim();
                // send results to players
                break;
            case Action.CHALLENGE:
                // challenge logic
                // Game.makeChallenge();
                // send results to players
                break;
            case Action.START_GAME:
                // start game logic
                // Game.startGame();
                // send results to players
                break;

        }
    }
}