import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GameService } from "../services/gameService";
import { useGameState } from "../store/gameStore";
import { GameStage } from "../../../shared/types";
import Card from "./Card/Card";
import Button from "./Button/Button";
import RollingScreen from "./GameRoom/RollingScreen";
import BiddingScreen from "./GameRoom/BiddingScreen";
import styles from "./GameRoom.module.css";

const GameRoom: React.FC = () => {
    const { gameCode } = useParams<{ gameCode: string }>();
    const navigate = useNavigate();
    const [playerName, setPlayerName] = useState<string>("");
    const [isJoined, setIsJoined] = useState(false);
    const [bidQuantity, setBidQuantity] = useState(1);
    const [bidValue, setBidValue] = useState(2);
    
    const { 
        webSocket, 
        error: storeError,
        gameState,
        isRolling,
        hasRolledThisRound
    } = useGameState();

    useEffect(() => {
        if (!gameCode) {
            console.log("No game code provided");
            navigate("/");
            return;
        }

        // If we have a token, try to connect
        const token = localStorage.getItem("gameToken");
        if (token && !webSocket) {
            try {
                GameService.createWebSocketConnection();
            } catch (error) {
                console.error("Failed to connect to game:", error);
            }
        }
    }, [gameCode, navigate, webSocket]);

    const handleJoinGame = async () => {
        if (!gameCode || !playerName.trim()) return;
        
        try {
            await GameService.joinGame(gameCode, playerName.trim());
            setIsJoined(true);
        } catch (error) {
            console.error("Failed to join game:", error);
        }
    };

    const handleMakeBid = () => {
        if (!webSocket || !gameState) return;
        
        GameService.makeClaim(bidValue, bidQuantity);
    };

    const handleCallLiar = () => {
        if (!webSocket) return;
        
        GameService.challengeClaim();
    };

    const handleStartGame = () => {
        if (!webSocket) return;
        
        GameService.startGame();
    };

    const handleRollDice = () => {
        if (!webSocket || hasRolledThisRound) return;
        
        GameService.startRound();
        // Don't set hasRolled immediately - wait for animation to complete
    };

    const handleRollComplete = () => {
        // Called when dice rolling animation completes
        useGameState.getState().setRolling(false);
        useGameState.getState().setHasRolled(true); // Only set after animation
    };

    // Current player helper
    const getCurrentPlayer = () => {
        if (!gameState) return null;
        const allPlayers = [gameState.player, ...gameState.opponents];
        return allPlayers[gameState.turnIndex];
    };

    const isCurrentPlayerTurn = () => {
        return getCurrentPlayer()?.id === gameState?.player.id;
    };

    // Show join form if not connected or no game state
    if (!isJoined || !gameState) {
        return (
            <div className={styles.container}>
                <Card title={`Join Game ${gameCode}`} error={storeError || null}>
                    <div className={styles.joinForm}>
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Enter your name"
                            className="input-field"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleJoinGame();
                                }
                            }}
                        />
                        <Button
                            onClick={handleJoinGame}
                            text="Join Game"
                            variant="red"
                            disabled={!playerName.trim()}
                        />
                    </div>
                </Card>
            </div>
        );
    }

    // Show lobby if game is in pre-game stage
    if (gameState?.gameStage === GameStage.PRE_GAME) {
        // Get all players (player + opponents)
        const allPlayers = [gameState.player, ...gameState.opponents];
        
        return (
            <div className={styles.container}>
                <div className={styles.gameHeader}>
                    <h2>Game: {gameCode}</h2>
                    <p className={styles.status}>Waiting for players...</p>
                </div>
                
                <Card title="Players" error={storeError || null}>
                    <div className={styles.playerList}>
                        {allPlayers.map((p) => (
                            <div key={p.id} className={styles.playerItem}>
                                <span className={styles.playerIcon}>
                                    {p.id === gameState.hostId ? '👑' : '👤'}
                                </span>
                                <span className={styles.playerName}>{p.name}</span>
                                {p.id === gameState.player.id && <span className={styles.youBadge}>You</span>}
                            </div>
                        ))}
                    </div>
                    
                    {gameState.player.isHost && allPlayers.length >= 2 && (
                        <div className={styles.actions}>
                            <Button
                                onClick={handleStartGame}
                                text="Start Game"
                                variant="red"
                            />
                        </div>
                    )}
                </Card>
            </div>
        );
    }

    // Main game view - separate rolling and bidding screens
    
    // ROLLING SCREEN - Show only dice rolling interface
    if (gameState.gameStage === GameStage.ROUND_ROBBIN && !hasRolledThisRound && isCurrentPlayerTurn()) {
        return (
            <RollingScreen
                playerDice={gameState.player.dice || []}
                isRolling={isRolling}
                onRollDice={handleRollDice}
                onRollComplete={handleRollComplete}
            />
        );
    }

    // BIDDING SCREEN - Show full game interface after rolling
    return (
        <BiddingScreen
            gameCode={gameCode || 'UNKNOWN'}
            gameState={gameState}
            bidQuantity={bidQuantity}
            bidValue={bidValue}
            setBidQuantity={setBidQuantity}
            setBidValue={setBidValue}
            onMakeBid={handleMakeBid}
            onCallLiar={handleCallLiar}
            getCurrentPlayer={getCurrentPlayer}
            isCurrentPlayerTurn={isCurrentPlayerTurn}
            hasRolledThisRound={hasRolledThisRound}
        />
    );
};

export default GameRoom;
