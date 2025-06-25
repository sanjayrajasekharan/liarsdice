import React, { useState } from "react";
import { GameStage, PublicPlayer } from "../../../../shared/types";
import Button from "../Button/Button";
import RollingScreen from "./RollingScreen";
import BiddingScreen from "./BiddingScreen";

// Mock game state for testing
const mockGameState = {
    gameStage: GameStage.ROUND_ROBBIN,
    hostId: "player1",
    currentClaim: null as { quantity: number; value: number; playerId: string } | null,
    turnIndex: 0,
    player: {
        id: "player1",
        name: "You",
        index: 0,
        remainingDice: 5,
        dice: [1, 2, 3, 4, 5],
        isHost: true
    },
    opponents: [
        {
            id: "player2",
            name: "Alice",
            index: 1,
            remainingDice: 5,
        },
        {
            id: "player3", 
            name: "Bob",
            index: 2,
            remainingDice: 4,
        }
    ]
};

const GameRoomMock: React.FC = () => {
    const [gameState, setGameState] = useState(mockGameState);
    const [isRolling, setIsRolling] = useState(false);
    const [hasRolledThisRound, setHasRolledThisRound] = useState(false);
    const [bidQuantity, setBidQuantity] = useState(1);
    const [bidValue, setBidValue] = useState(2);

    // Mock functions that mirror the real GameRoom
    const handleRollDice = () => {
        setIsRolling(true);
        // Don't set hasRolled immediately - wait for animation to complete (same as real GameRoom)
        
        // Generate new random dice after a delay to simulate server response
        setTimeout(() => {
            const newDice = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);
            setGameState(prev => ({
                ...prev,
                player: {
                    ...prev.player,
                    dice: newDice
                }
            }));
        }, 500); // Short delay to simulate network
    };

    const handleRollComplete = () => {
        // Mirror the real GameRoom behavior exactly
        setIsRolling(false);
        setHasRolledThisRound(true); // Only set after animation completes
    };

    const handleMakeBid = () => {
        const newClaim = {
            quantity: bidQuantity,
            value: bidValue,
            playerId: gameState.player.id
        };
        
        setGameState(prev => ({
            ...prev,
            currentClaim: newClaim,
            turnIndex: (prev.turnIndex + 1) % (prev.opponents.length + 1)
        }));
        
        console.log("Mock bid made:", newClaim);
    };

    const handleCallLiar = () => {
        console.log("Mock: Called liar!");
        // Reset round
        setGameState(prev => ({
            ...prev,
            currentClaim: null,
            turnIndex: 0
        }));
        setHasRolledThisRound(false);
    };

    // Helper functions that mirror GameRoom exactly
    const getCurrentPlayer = (): PublicPlayer | null => {
        const allPlayers = [gameState.player, ...gameState.opponents];
        return allPlayers[gameState.turnIndex] || null;
    };

    const isCurrentPlayerTurn = (): boolean => {
        return getCurrentPlayer()?.id === gameState.player.id;
    };

    return (
        <>
            {/* Mock Banner */}
            <div style={{ 
                background: 'var(--color-yellow-500)', 
                padding: 'var(--space-sm)', 
                textAlign: 'center',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
                position: 'sticky',
                top: 0,
                zIndex: 1000
            }}>
                🧪 MOCK MODE - Uses Real Components | {hasRolledThisRound ? 'Bidding Screen' : 'Rolling Screen'}
            </div>

            {/* Use the EXACT same components as GameRoom */}
            {!hasRolledThisRound && isCurrentPlayerTurn() ? (
                /* ROLLING SCREEN - Same component as real GameRoom */
                <RollingScreen
                    playerDice={gameState.player.dice || []}
                    isRolling={isRolling}
                    onRollDice={handleRollDice}
                    onRollComplete={handleRollComplete}
                />
            ) : (
                /* BIDDING SCREEN - Same component as real GameRoom */
                <BiddingScreen
                    gameCode="MOCK123"
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
            )}

            {/* Testing Controls - Fixed at bottom */}
            <div style={{ 
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: 'var(--space-sm)', 
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                background: 'var(--surface-elevated)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 1000
            }}>
                <h4 style={{ margin: '0 0 var(--space-xs) 0', fontSize: 'var(--text-sm)' }}>🧪 Test Controls</h4>
                <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                    <Button
                        onClick={() => setHasRolledThisRound(!hasRolledThisRound)}
                        text={hasRolledThisRound ? "Back to Rolling" : "Skip to Bidding"}
                        variant="red"
                    />
                    <Button
                        onClick={() => setGameState(prev => ({ 
                            ...prev, 
                            turnIndex: (prev.turnIndex + 1) % (prev.opponents.length + 1) 
                        }))}
                        text="Next Turn"
                        variant="black"
                    />
                    <Button
                        onClick={() => setGameState(prev => ({ ...prev, currentClaim: null }))}
                        text="Clear Bid"
                        variant="black"
                    />
                </div>
            </div>
        </>
    );
};

export default GameRoomMock;
