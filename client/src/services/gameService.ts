import { use } from "framer-motion/client";
import {
    ServerMessage,
    PlayerMessage,
    ErrorMessage,
} from "../../../shared/messages.ts";
import { GameStage, StateChange } from "../../../shared/states.ts";
import { useGameState } from "../store/gameStore.ts";
import { create } from "zustand";

import { Action, Claim } from "../../../shared/actions.ts";

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

    static async gameExists(gameCode: string): Promise<boolean> {
        console.log("gameExists called");
        const response = await fetch(`${this.baseUrl}/game/${gameCode}`);
        console.log("response", response);
        if (!response.ok) {
            // if (response.status === 404) {
            return false;
            // }
            // else throw new Error("Failed to check if game exists");
        }
        return true;
    }

    static async playerInGame(
        gameCode: string,
        playerId: string
    ): Promise<boolean> {
        console.log("playerInGame called");
        const response = await fetch(
            `${this.baseUrl}/member/${gameCode}/${playerId}`
        );
        if (!response.ok) {
            if (response.status === 403) {
                return false;
            }
            if (response.status === 404) {
                throw new Error(`Game "${gameCode}" does not exist`);
            }
            throw new Error("Failed to check if player is in game");
        }
        return true;
    }

    static async createGame(hostName: string): Promise<void> {
        const hostId = this.getOrCreatePlayerId();

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

        useGameState
            .getState()
            .updateGameCode((await response.json()).gameCode);

        if (!response.ok) {
            throw new Error("Failed to create game");
        }

        useGameState.getState().setPlayer(hostId, hostName, true);

        const ws = this.createWebSocketConnection(
            useGameState.getState().gameCode,
            hostId
        );
        useGameState.getState().updateWebsocket(ws);
    }

    static async joinGame(gameCode: string, playerName: string): Promise<void> {
        //validate game code and player name
        //game code must be 3 words seperated by dash

        if (!/^\w+-\w+-\w+$/.test(gameCode)) {
            throw new Error("Invalid game code");
        }

        if (playerName.length < 2) {
            throw new Error("Player name must be at least 2 characters");
        }

        // create player
        useGameState
            .getState()
            .setPlayer(this.getOrCreatePlayerId(), playerName, false);
        const player = useGameState.getState().player;

        if (player == null) return;

        const playerId = player.id;

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
            if (error.error !== "Player already in the game")
                throw new Error(error.error || "Failed to join game");
        }

        // make websocket connection

        // console.log;
        useGameState
            .getState()
            .updateWebsocket(
                this.createWebSocketConnection(gameCode, playerId)
            );
    }

    static async rejoinGame(gameCode: string, playerId: string): Promise<void> {
        useGameState
            .getState()
            .updateWebsocket(
                this.createWebSocketConnection(gameCode, playerId)
            );
    }

    static isValidClaim(value: number, quantity: number): boolean {
        if (quantity > useGameState.getState().claim.quantity) {
            return true;
        }
        if (quantity === useGameState.getState().claim.quantity) {
            return value > useGameState.getState().claim.value;
        }

        return false;
    }

    static async makeClaim(value: number, quantity: number): Promise<void> {
        if (!this.isValidClaim(value, quantity)) {
            throw new Error(
                "Invalid claim: Dice value or quantity must increase"
            );
        }

        const ws = useGameState.getState().webSocket;
        const player = useGameState.getState().player;

        if (ws == null || !player) {
            throw new Error("Not connected to game server");
        }
        const claimMessage: PlayerMessage = {
            player: player.id,
            action: Action.CLAIM,
            claim: { value, quantity },
        };

        ws.send(JSON.stringify(claimMessage));
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

        ws.onclose = (event) => {
            console.log("WebSocket connection closed:", event);
            if (event.code !== 1008) {
                // player is not autorhized
                setTimeout(
                    () => this.createWebSocketConnection(gameCode, playerId),
                    5000
                );
            }
        };

        ws.onmessage = (event) => {
            const message: ServerMessage = JSON.parse(event.data);
            console.log(message);

            if (message.gameState) {
                console.log("TF");
                console.log("updating opponents");
                useGameState.getState().updateOpponents(
                    message.gameState.opponents.map((opponent) => ({
                        name: opponent.name,
                        icon: "😀",
                        id: opponent.id,
                        remainingDice: opponent.remainingDice,
                        dice: opponent.dice,
                    }))
                );

                useGameState
                    .getState()
                    .updateClaim(message.gameState.currentClaim);
                useGameState.getState().updateTurn(message.gameState.turnIndex);
                useGameState
                    .getState()
                    .setPlayer(
                        message.gameState.player.id,
                        message.gameState.player.name,
                        message.gameState.player.isHost
                    );
            }

            console.log("WTF");
            switch (message.change) {
                case StateChange.GAME_STARTED:
                    // handle game start, mount table, i think
                    break;
                case StateChange.PLAYER_LEFT:
                    // handle player leaving, low prioirty
                    console.log("here");
                    if (message.player != null) {
                        const playerId = message.player.id;
                        useGameState
                            .getState()
                            .updateOpponents(
                                useGameState
                                    .getState()
                                    .opponents.filter(
                                        (opponent) => opponent.id !== playerId
                                    )
                            );
                    }
                    break;
                case StateChange.PLAYER_JOINED:
                    // handle player joining, low priority
                    // updateGameState
                    console.log("updating opponents");
                    if (message.player != null)
                        useGameState.getState().updateOpponents(
                            useGameState.getState().opponents.concat({
                                name: message.player.name,
                                icon: "😀",
                                id: message.player.id,
                                remainingDice: 6,
                                dice: [],
                            })
                        );
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
                        useGameState
                            .getState()
                            .updateTurn(
                                (message.player.index + 1) %
                                    (useGameState.getState().opponents.length +
                                        1)
                            );
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
