import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameState } from "../../store/gameStore";
import PlayerList from "./PlayerList/PlayerList";
import styles from "./PlayerLobby.module.css";
import { GameService } from "../../services/gameService";
import Button from "../Button/Button";
import Card from "../Card/Card";

// mounts the player lobby component and updates the player list based on websocket messages

const PlayerLobby: React.FC = () => {
    const navigate = useNavigate();
    const gs = useGameState();
    const gameCode = gs.gameCode;


    useEffect(() => {
        // Redirect to game room if game code is available
        if (gameCode) {
            navigate(`/game/${gameCode}`);
        }
    }, [gameCode, navigate]);

    const handleStartGame = async () => {
        try {
            await GameService.startGame(gameCode);
        } catch (error) {
            console.error("Failed to start game:", error);
        }
    };

    return (
        <div className={styles.container}>
            <Card title="Player Lobby">
                <PlayerList players={players} userId={userId} />
                <div className={styles.actions}>
                    <Button
                        onClick={handleStartGame}
                        text="Start Game"
                        variant="red"
                        disabled={players.length < 2}
                    />
                </div>
            </Card>
        </div>
    );
};

export default PlayerLobby;