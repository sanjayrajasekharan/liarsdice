import { ServerMessage, ClientMessage } from "../../../shared/protocol.ts";
import { useGameState } from "../store/gameStore.ts";

export class GameService {
    private static baseUrl = "http://localhost:3000";
    private static wsUrl = "ws://localhost:3000";

    static getOrCreatePlayerId(): string {
        let id = localStorage.getItem("playerId");
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem("playerId", id);
        }
        return id;
    }

    static async createGame(playerName: string): Promise<void> {
        if (playerName.length < 2) {
            throw new Error("Player name must be at least 2 characters");
        }

        const playerId = this.getOrCreatePlayerId();
        
        const response = await fetch(`${this.baseUrl}/create-game`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                hostId: playerId,
                hostName: playerName,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to create game");
        }

        const data = await response.json();
        
        // Store token and update state
        localStorage.setItem("gameToken", data.token);
        useGameState.getState().updateGameCode(data.gameCode);
    }

    static async joinGame(gameCode: string, playerName: string): Promise<void> {
        if (playerName.length < 2) {
            throw new Error("Player name must be at least 2 characters");
        }

        const playerId = this.getOrCreatePlayerId();

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

        const data = await response.json();
        
        // Store token and update state
        localStorage.setItem("gameToken", data.token);
        useGameState.getState().updateGameCode(gameCode);
    }

    static createWebSocketConnection(): WebSocket {
        const token = localStorage.getItem("gameToken");
        if (!token) {
            throw new Error("No authentication token found");
        }

        const ws = new WebSocket(
            `${this.wsUrl}/?token=${token}`,
            "liarsdice-game"
        );

        ws.onopen = () => {
            console.log("Connected to game server");
            useGameState.getState().updateWebsocket(ws);
        };

        ws.onmessage = (event) => {
            try {
                const message: ServerMessage = JSON.parse(event.data);
                this.handleServerMessage(message);
            } catch (error) {
                console.error("Error parsing server message:", error);
            }
        };

        ws.onclose = () => {
            console.log("Disconnected from game server");
            useGameState.getState().updateWebsocket(null);
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            useGameState.getState().updateError("Connection error");
        };

        return ws;
    }

    static handleServerMessage(message: ServerMessage): void {
        const state = useGameState.getState();
        
        switch (message.type) {
            case "GAME_STATE": {
                // Update the entire game state from backend
                state.updateGameState(message.state);
                break;
            }

            case "PLAYER_JOINED":
                console.log("Player joined:", message.player);
                break;

            case "PLAYER_LEFT":
                console.log("Player left:", message.player);
                break;

            case "GAME_STARTED":
                console.log("Game started!");
                // Reset round state when game starts
                state.resetRoundState();
                break;

            case "ROUND_STARTED": {
                console.log("Round started, starting player:", message.startingPlayer);
                console.log("Your dice:", message.dice);
                
                // Reset round state and start rolling animation
                state.resetRoundState();
                state.setRolling(true);
                
                // Simulate rolling animation for the received dice
                // The DiceRoll component will handle the animation and reveal
                break;
            }

            case "CLAIM_MADE":
                console.log("Claim made:", message.claim);
                break;

            case "CHALLENGE_RESULT":
                console.log("Challenge result:", message);
                // Reset for next round
                state.resetRoundState();
                break;

            case "ERROR":
                state.updateError(message.message);
                break;

            default:
                console.log("Unknown message type:", message);
        }
    }

    static startGame(): void {
        const ws = useGameState.getState().webSocket;
        if (!ws) {
            throw new Error("Not connected to game server");
        }

        const message: ClientMessage = {
            type: "START_GAME"
        };

        ws.send(JSON.stringify(message));
    }

    static startRound(): void {
        const ws = useGameState.getState().webSocket;
        if (!ws) {
            throw new Error("Not connected to game server");
        }

        const message: ClientMessage = {
            type: "START_ROUND"
        };

        ws.send(JSON.stringify(message));
        
        // Mark that rolling has started locally
        useGameState.getState().setRolling(true);
    }

    static makeClaim(value: number, quantity: number): void {
        const ws = useGameState.getState().webSocket;
        if (!ws) {
            throw new Error("Not connected to game server");
        }

        const message: ClientMessage = {
            type: "CLAIM",
            claim: { value, quantity }
        };

        ws.send(JSON.stringify(message));
    }

    static challengeClaim(): void {
        const ws = useGameState.getState().webSocket;
        if (!ws) {
            throw new Error("Not connected to game server");
        }

        const message: ClientMessage = {
            type: "CHALLENGE"
        };

        ws.send(JSON.stringify(message));
    }
}
