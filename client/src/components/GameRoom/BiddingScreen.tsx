import React from "react";
import { GameState, PublicPlayer } from "../../../../shared/types";
import Button from "../Button/Button";
import DiceRoll from "../DiceRoll/DiceRoll";
import styles from "./GameRoom.module.css";

interface BiddingScreenProps {
    gameCode: string;
    gameState: GameState;
    bidQuantity: number;
    bidValue: number;
    setBidQuantity: (value: number) => void;
    setBidValue: (value: number) => void;
    onMakeBid: () => void;
    onCallLiar: () => void;
    getCurrentPlayer: () => PublicPlayer | null;
    isCurrentPlayerTurn: () => boolean;
    hasRolledThisRound: boolean;
}

const BiddingScreen: React.FC<BiddingScreenProps> = ({
    gameCode,
    gameState,
    bidQuantity,
    bidValue,
    setBidQuantity,
    setBidValue,
    onMakeBid,
    onCallLiar,
    getCurrentPlayer,
    isCurrentPlayerTurn,
    hasRolledThisRound
}) => {
    return (
        <div className={styles.mobileGameContainer}>
            {/* Game Header */}
            <div className={styles.gameHeader}>
                <div className={styles.gameInfo}>
                    <span className={styles.gameCode}>Game: {gameCode}</span>
                    <span className={styles.turnIndicator}>
                        Turn: {getCurrentPlayer()?.name || 'Loading...'}
                    </span>
                </div>
            </div>

            {/* Current Bid Display */}
            <div className={styles.currentBid}>
                <h3>Current Bid</h3>
                {gameState?.currentClaim ? (
                    <div className={styles.bidDisplay}>
                        <span className={styles.bidText}>
                            {gameState.currentClaim.quantity} × 🎲{gameState.currentClaim.value}
                        </span>
                        <span className={styles.bidder}>
                            by {gameState.opponents.find(p => p.id === gameState.currentClaim?.playerId)?.name || 
                                 (gameState.currentClaim?.playerId === gameState.player.id ? 'You' : 'Unknown')}
                        </span>
                    </div>
                ) : (
                    <div className={styles.noBid}>No bids yet</div>
                )}
            </div>

            {/* Your Dice - Compact view after rolling */}
            <div className={styles.yourDice}>
                <h3>Your Dice ({gameState.player.dice?.length || 0})</h3>
                <div className={styles.diceContainer}>
                    <DiceRoll 
                        diceValues={gameState.player.dice || []} 
                        isRolling={false}
                        onRollComplete={() => {}}
                    />
                </div>
            </div>

            {/* Other Players */}
            <div className={styles.otherPlayers}>
                <h3>👥 Other Players</h3>
                <div className={styles.playerGrid}>
                    {gameState.opponents.map((p) => (
                        <div 
                            key={p.id} 
                            className={`${styles.playerCard} ${
                                getCurrentPlayer()?.id === p.id ? styles.currentPlayer : ''
                            }`}
                        >
                            <div className={styles.playerInfo}>
                                <span className={styles.playerIcon}>
                                    {p.id === gameState.hostId ? '👑' : '👤'}
                                </span>
                                <span className={styles.playerName}>{p.name}</span>
                                {getCurrentPlayer()?.id === p.id && (
                                    <span className={styles.turnBadge}>🎯</span>
                                )}
                            </div>
                            <div className={styles.diceCount}>
                                {p.remainingDice} 🎲
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Zone - Bottom for thumb access */}
            <div className={styles.actionZone}>
                {isCurrentPlayerTurn() && hasRolledThisRound ? (
                    <div className={styles.yourTurn}>
                        <div className={styles.bidControls}>
                            <div className={styles.bidInputs}>
                                <div className={styles.inputGroup}>
                                    <label>Die Value</label>
                                    <select 
                                        value={bidValue} 
                                        onChange={(e) => setBidValue(Number(e.target.value))}
                                        className={styles.bidSelect}
                                    >
                                        {[1, 2, 3, 4, 5, 6].map(num => (
                                            <option key={num} value={num}>🎲{num}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Quantity</label>
                                    <select 
                                        value={bidQuantity} 
                                        onChange={(e) => setBidQuantity(Number(e.target.value))}
                                        className={styles.bidSelect}
                                    >
                                        {Array.from({length: 10}, (_, i) => i + 1).map(num => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <Button
                                onClick={onMakeBid}
                                text={`Bid`}
                                variant="red"
                            />
                        </div>
                        
                        {gameState.currentClaim && (
                            <Button
                                onClick={onCallLiar}
                                text="🚨 Call Liar!"
                                variant="black"
                            />
                        )}
                    </div>
                ) : (
                    <div className={styles.waitingTurn}>
                        <p>Waiting for {getCurrentPlayer()?.name}'s turn...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BiddingScreen;
