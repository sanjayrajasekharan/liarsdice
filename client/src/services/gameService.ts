import { use } from "framer-motion/client";
import {ServerMessage, PlayerMessage, ErrorMessage} from "../../../shared/messages.ts";
import {GameStage, StateChange} from "../../../shared/states.ts";
import { useGameState } from "../store/gameStore.ts";


interface CreateGameResponse {
    gameCode: string;
    message: string;
}

interface JoinGameResponse {
    gameCode: string;
    playerIndex: number;
    message: string;
}

export class GameService {
    private static baseUrl = "http://localhost:3000";
    private static wsUrl = "ws://localhost:3000";

    static getOrCreatePlayerId() {
        let id = localStorage.getItem("playerId");
        if (!id) {
            id = crypto.randomUUID();
        }
        return id;
    }

    static async createGame(hostName: string): Promise<CreateGameResponse> {
        const hostId = crypto.randomUUID(); // Generate a unique ID for the host

        const response = await fetch(`${this.baseUrl}/create-game`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                hostId,
                hostName,
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to create game");
        }

        return response.json();
    }

    static async joinGame(
        gameCode: string,
        playerName: string
    ): Promise<JoinGameResponse> {
        const playerId = crypto.randomUUID(); // Generate a unique ID for the player

        const response = await fetch(`${this.baseUrl}/join-game`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                gameCode,
                playerId,
                playerName,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to join game");
        }

        return response.json();
    }

    static createWebSocketConnection(
        gameCode: string,
        playerId: string
    ): WebSocket {
        const ws = new WebSocket(
            `${this.wsUrl}?gameCode=${gameCode}&playerId=${playerId}`
        );

        ws.onopen = () => {
            console.log("Connected to game server");
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        ws.onclose = () => {
            setTimeout(
                () => this.createWebSocketConnection(gameCode, playerId),
                5000
            );
        };

        ws.onmessage = (event) => {
            const message : ServerMessage = JSON.parse(event.data);

            switch (message.change) {
                case StateChange.GAME_STARTED:
                    // handle game start, mount table, i think
                    break;
                case StateChange.PLAYER_LEFT:
                    // handle player leaving, low prioirty
                    break;
                case StateChange.PLAYER_JOINED:
                    // handle player joining, low priority
                    break;
                case StateChange.ROUND_STARTED:
                    // handle round start, mount dice roller
                    break;
                case StateChange.DICE_ROLLED:
                    // load keypad etc

                case StateChange.CLAIM_MADE:
                    // update zustand
                    if (message.claim != null) {
                        useGameState.getState().updateClaim(message.claim);
                       
                    }

                    if (message.player != null) {

                        useGameState.getState().updateTurn((message.player.index + 1 )%(useGameState.getState().opponents.length + 1));
                    }
                    break;

                    case StateChange.CHALLENGE_MADE:
                        // if (message.challenge != null) {

                        //     useGameState.getState().updateClaim(message.challenge);
                        // }
                }



        };

        return ws;
    }
}
