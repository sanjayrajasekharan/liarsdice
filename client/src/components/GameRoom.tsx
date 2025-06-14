import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GameService } from "../services/gameService";
import { useGameState } from "../store/gameStore";
import Card from "./Card/Card";
import Button from "./Button/Button";
import PlayerLobby from "./PlayerLobby/PlayerLobby";
import JoinGame from "../pages/JoinGame";

interface GameRoomProps {
    isHost: boolean;
    playerName: string;
    playerId: string;
}

const GameRoom: React.FC<GameRoomProps> = ({
    isHost,
    playerName,
    playerId,
}) => {
    const { gameCode } = useParams<{ gameCode: string }>();
    const navigate = useNavigate();
    // const [players, setPlayers] = useState<string[]>([]);
    const ws = useRef<WebSocket | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState<string>("");

    useEffect(() => {
        console.log(gameCode);
        if (!gameCode) {
            console.log("No game code");
            navigate("/");
            return;
        }

        // const websocket = GameService.createWebSocketConnection(gameCode, playerId);

        const connectToGame = async () => {
            try {
                if (!useGameState().webSocket)
                    console.log("player in Game but ");
                GameService.joinGame(gameCode, playerName);
            } catch (error) {
                if (error instanceof Error) {
                    useGameState.getState().updateError(error.message);
                    navigate("/");
                }
            }
        };

        // console.log("About to call gameExists with:", gameCode);

        if (useGameState.getState().gameCode === useGameState.getInitialState().gameCode) {
            console.log("disconnected", GameService.getOrCreatePlayerId());
            GameService.playerInGame(gameCode, GameService.getOrCreatePlayerId())
                .then((inGame) => {
                    if (inGame) {
                        console.log("Player in game");
                        GameService.rejoinGame(
                            gameCode,
                            GameService.getOrCreatePlayerId()
                        );
                    }
                })
                .catch((error) => {
                    console.log(error);
                    useGameState.getState().updateError(error.message);
                    navigate("/");
                });
        }
    }, [gameCode]);

    useEffect(() => {
        // TODO: check if gameCode is valid
        // Create WebSocket connection
        // gameCode is undefined when the component first mounts
        if (!gameCode) {
            navigate("/");
            return;
        }
    }, [gameCode, navigate, playerId]);

    const handleStartGame = () => {
        if (ws.current) {
            ws.current.send(JSON.stringify({ action: "START_GAME" }));
        }
    };

    const handleJoinGame = async () => {
        if (gameCode && name) await GameService.joinGame(gameCode, name);
    };

    return (
        <div className="container">
            {/* if no player set ask for playerName and set*/}
            {useGameState().player === null ? (
                <Card title={`JOIN`} error={error}>
                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="input-field"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleJoinGame(); // Trigger the button press
                                }
                            }}
                        />
                        <Button
                            onClick={handleJoinGame}
                            text="Join"
                            variant="red"
                        />
                    </div>
                </Card>
            ) : (
                <Card title={`PLAYERS`} error={error}>
                    <PlayerLobby />
                </Card>
            )}
        </div>
    );
};

export default GameRoom;
