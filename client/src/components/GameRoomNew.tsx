import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GameService } from "../services/gameService";
import { useGameState } from "../store/gameStore";
import { GameStage, PublicPlayer } from "../../../shared/types";
import DiceRoll from "./DiceRoll/DiceRoll";
import DiceSvg from "./DiceSvg/DiceSvg";
import styles from "./GameRoomNew.module.css";

type GameUIStage = 'joining' | 'waiting' | 'rolling' | 'bidding' | 'results';

const GameRoomNew: React.FC = () => {
    const { gameCode } = useParams<{ gameCode: string }>();
    const navigate = useNavigate();
    const [playerName, setPlayerName] = useState<string>("");
    const [isJoined, setIsJoined] = useState(false);
    const [uiStage, setUIStage] = useState<GameUIStage>('joining');
    const [bidQuantity, setBidQuantity] = useState(1);
    const [bidValue, setBidValue] = useState(2);
    
    const { 
        webSocket, 
        error: storeError,
        gameState,
        isRolling,
        hasRolledThisRound
    } = useGameState();

    // Stage transition logic
    useEffect(() => {
        if (!gameState) return;

        switch (gameState.gameStage) {
            case GameStage.PRE_GAME:
                setUIStage('waiting');
                break;
            case GameStage.ROUND_ROBBIN:
                if (!hasRolledThisRound) {
                    setUIStage('rolling');
                } else {
                    // Transition to bidding after a short delay
                    const timer = setTimeout(() => setUIStage('bidding'), 1500);
                    return () => clearTimeout(timer);
                }
                break;
            case GameStage.POST_ROUND:
                setUIStage('results');
                break;
            case GameStage.POST_GAME:
                setUIStage('results');
                break;
        }
    }, [gameState, hasRolledThisRound]);

    useEffect(() => {
        if (!gameCode) {
            console.log("No game code provided");
            navigate("/");
            return;
        }

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

    const handleRollDice = async () => {
        // For now, just trigger the animation. The backend will handle dice rolling
        // when the round starts and sends ROUND_STARTED message
        console.log("Roll dice requested");
    };

    const handleMakeBid = async () => {
        try {
            GameService.makeClaim(bidValue, bidQuantity);
        } catch (error) {
            console.error("Failed to make bid:", error);
        }
    };

    const handleCallLiar = async () => {
        try {
            GameService.challengeClaim();
        } catch (error) {
            console.error("Failed to call liar:", error);
        }
    };

    const getCurrentPlayer = (): PublicPlayer | null => {
        if (!gameState) return null;
        const allPlayers = [gameState.player, ...gameState.opponents];
        // We need to determine current player based on turnIndex
        return allPlayers[gameState.turnIndex] || null;
    };

    const isCurrentPlayerTurn = (): boolean => {
        const playerId = localStorage.getItem("playerId");
        const currentPlayerIndex = gameState?.turnIndex ?? -1;
        const playerIndex = gameState?.player.id === playerId ? gameState.player.index : 
                          gameState?.opponents.find(p => p.id === playerId)?.index ?? -1;
        return currentPlayerIndex === playerIndex;
    };

    const getOwnPlayer = (): PublicPlayer | null => {
        if (!gameState) return null;
        const playerId = localStorage.getItem("playerId");
        if (gameState.player.id === playerId) return gameState.player;
        return gameState.opponents.find(p => p.id === playerId) || null;
    };

    const getAllPlayers = (): PublicPlayer[] => {
        if (!gameState) return [];
        return [gameState.player, ...gameState.opponents];
    };

    if (storeError) {
        return (
            <div className={styles.gameContainer}>
                <div className={styles.contentArea}>
                    <div className={styles.stageContent}>
                        <h2>Connection Error</h2>
                        <p>{storeError}</p>
                        <button onClick={() => navigate("/")} className={styles.actionButton}>
                            Return to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!isJoined) {
        return (
            <div className={styles.gameContainer}>
                <div className={styles.gameHeader}>
                    <span className={styles.gameCode}>Game: {gameCode}</span>
                    <DiceSvg value={5} size={40} className={styles.diceLogo} />
                </div>
                
                <div className={styles.contentArea}>
                    <div className={styles.stageContent}>
                        <h2>Join Game</h2>
                        <div className={styles.claimInputSection}>
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: 'var(--spacing-md)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text-primary)',
                                    fontSize: 'var(--font-size-md)',
                                    marginBottom: 'var(--spacing-lg)'
                                }}
                                onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
                            />
                            <button 
                                onClick={handleJoinGame} 
                                className={`${styles.actionButton} ${styles.primary}`}
                                disabled={!playerName.trim()}
                            >
                                Join Game
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!gameState) {
        return (
            <div className={styles.gameContainer}>
                <div className={styles.contentArea}>
                    <div className={styles.stageContent}>
                        <h2>Connecting...</h2>
                    </div>
                </div>
            </div>
        );
    }

    const ownPlayer = getOwnPlayer();

    return (
        <div className={styles.gameContainer}>
            <div className={styles.gameHeader}>
                <span className={styles.gameCode}>Game: {gameCode}</span>
                <DiceSvg value={5} size={40} className={styles.diceLogo} />
            </div>
            
            <div className={styles.contentArea}>
                {/* Stage 1: Waiting for players */}
                {uiStage === 'waiting' && (
                    <div className={styles.stageContent}>
                        <div className={styles.rollingStage}>
                            <h2>Waiting for Players...</h2>
                            <div className={styles.playersSection}>
                                <h3 className={styles.playersTitle}>Players ({getAllPlayers().length})</h3>
                                <div className={styles.playersList}>
                                    {getAllPlayers().map((player) => (
                                        <div key={player.id} className={styles.playerItem}>
                                            <span className={styles.playerName}>{player.name}</span>
                                            <span className={styles.playerStatus}>Ready</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stage 2: Rolling dice */}
                {uiStage === 'rolling' && (
                    <div className={styles.stageContent}>
                        <div className={styles.rollingStage}>
                            <h2>
                                {isCurrentPlayerTurn() ? "Your Turn - Roll Your Dice!" : `${getCurrentPlayer()?.name || 'Player'} is Rolling...`}
                            </h2>
                            
                            <div className={styles.diceContainer}>
                                <DiceRoll 
                                    diceValues={ownPlayer?.dice || [1, 2, 3, 4, 5]} 
                                    isRolling={isRolling}
                                    onRollComplete={() => {}}
                                />
                            </div>
                            
                            {isCurrentPlayerTurn() && !hasRolledThisRound && !isRolling && (
                                <button className={styles.rollButton} onClick={handleRollDice}>
                                    🎲 Roll!
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Stage 3: Bidding/Claiming */}
                {uiStage === 'bidding' && (
                    <div className={styles.stageContent}>
                        {/* Current Claim Display */}
                        {gameState.currentClaim && (
                            <div className={styles.currentClaim}>
                                <div className={styles.claimText}>
                                    "{gameState.currentClaim.quantity}x {gameState.currentClaim.value}s" - {getAllPlayers().find(p => p.id === gameState.currentClaim?.playerId)?.name || 'Player'}
                                </div>
                            </div>
                        )}

                        {/* Players List - Compact */}
                        <div className={styles.playersSection}>
                            <div className={styles.playersList}>
                                {getAllPlayers().map((player) => {
                                    const currentPlayer = getCurrentPlayer();
                                    return (
                                        <div key={player.id} className={`${styles.playerItem} ${player.id === currentPlayer?.id ? styles.currentPlayer : ''}`}>
                                            <span className={styles.playerName}>{player.name}</span>
                                            <span className={styles.playerStatus}>{player.remainingDice || 5} dice</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Your Dice */}
                        <div className={styles.diceValues}>
                            <div className={styles.diceValuesTitle}>dice values</div>
                            <div className={styles.diceContainer}>
                                <DiceRoll 
                                    diceValues={ownPlayer?.dice || [1, 2, 3, 4, 5]} 
                                    isRolling={false}
                                    onRollComplete={() => {}}
                                />
                            </div>
                        </div>

                        {/* Claim Input - Only for current player */}
                        {isCurrentPlayerTurn() && (
                            <div className={styles.claimInputSection}>
                                <div className={styles.claimControls}>
                                    <div className={styles.claimControl}>
                                        <div className={styles.controlLabel}>Quantity</div>
                                        <div className={styles.valueDisplay}>
                                            <button 
                                                className={styles.adjustButton}
                                                onClick={() => setBidQuantity(Math.max(1, bidQuantity - 1))}
                                            >
                                                ↓
                                            </button>
                                            <span className={styles.valueNumber}>{bidQuantity}</span>
                                            <button 
                                                className={styles.adjustButton}
                                                onClick={() => setBidQuantity(bidQuantity + 1)}
                                            >
                                                ↑
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className={styles.claimControl}>
                                        <div className={styles.controlLabel}>Value</div>
                                        <div className={styles.valueDisplay}>
                                            <button 
                                                className={styles.adjustButton}
                                                onClick={() => setBidValue(Math.max(2, bidValue - 1))}
                                            >
                                                ↓
                                            </button>
                                            <span className={styles.valueNumber}>{bidValue}</span>
                                            <button 
                                                className={styles.adjustButton}
                                                onClick={() => setBidValue(Math.min(6, bidValue + 1))}
                                            >
                                                ↑
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={styles.actionButtons}>
                                    <button 
                                        className={`${styles.actionButton} ${styles.primary}`}
                                        onClick={handleMakeBid}
                                    >
                                        Make Claim
                                    </button>
                                    <button 
                                        className={`${styles.actionButton} ${styles.secondary}`}
                                        onClick={handleCallLiar}
                                    >
                                        Challenge
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Waiting message when not player's turn */}
                        {!isCurrentPlayerTurn() && (
                            <div className={styles.currentClaim}>
                                <div className={styles.claimText}>
                                    Waiting for {getCurrentPlayer()?.name || 'Player'}...
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Stage 4: Results */}
                {uiStage === 'results' && (
                    <div className={styles.stageContent}>
                        <h2>Round Results</h2>
                        {/* Results content here */}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GameRoomNew;
