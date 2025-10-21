import React, { useState } from "react";
import DiceRoll from "./DiceRoll/DiceRoll";
import DiceSvg from "./DiceSvg/DiceSvg";
import Button from "./Button/Button";
import styles from "./GameRoomNew.module.css";

type GameUIStage = 'waiting' | 'rolling' | 'bidding' | 'results';

const GameRoomNewMock: React.FC = () => {
    const [uiStage, setUIStage] = useState<GameUIStage>('waiting');
    const [bidQuantity, setBidQuantity] = useState(1);
    const [bidValue, setBidValue] = useState(2);
    const [isRolling, setIsRolling] = useState(false);
    const [showClaimModal, setShowClaimModal] = useState(false);

    // Mock data
    const mockPlayers = [
        { id: "1", name: "Alice", remainingDice: 5, index: 0 },
        { id: "2", name: "Bob", remainingDice: 4, index: 1 },
        { id: "3", name: "Charlie", remainingDice: 5, index: 2 }
    ];

    const mockCurrentClaim = {
        quantity: 3,
        value: 4,
        playerId: "1"
    };

    const mockOwnDice = [2, 4, 4, 6, 1];
    const currentPlayerIndex = 0; // Alice's turn

    const handleRollDice = () => {
        setIsRolling(true);
        setTimeout(() => {
            setIsRolling(false);
            // Auto-advance to bidding after rolling
            setTimeout(() => setUIStage('bidding'), 1000);
        }, 2000);
    };

    const handleMakeBid = () => {
        console.log(`Mock bid: ${bidQuantity}x ${bidValue}s`);
        setShowClaimModal(false);
    };

    const handleCallLiar = () => {
        console.log("Mock challenge called");
        setUIStage('results');
    };

    const handleOpenClaimModal = () => {
        setShowClaimModal(true);
    };

    const isCurrentPlayerTurn = () => currentPlayerIndex === 0; // Always Alice's turn in mock

    const renderDice = (value: number, quantity: number) => {
        return Array.from({ length: quantity }, (_, i) => (
            <DiceSvg key={i} value={value} size={24} />
        ));
    };

    return (
        <div className={styles.gameContainer}>
            <div className={styles.gameHeader}>
                <span className={styles.gameCode}>Game: MOCK123</span>
                <DiceSvg value={5} size={40} className={styles.diceLogo} />
            </div>
            
            {/* Test Stage Controls */}
            <div className={styles.testControls}>
                <Button 
                    text="Waiting"
                    variant={uiStage === 'waiting' ? 'red' : 'black'}
                    onClick={() => setUIStage('waiting')}
                />
                <Button 
                    text="Rolling"
                    variant={uiStage === 'rolling' ? 'red' : 'black'}
                    onClick={() => setUIStage('rolling')}
                />
                <Button 
                    text="Bidding"
                    variant={uiStage === 'bidding' ? 'red' : 'black'}
                    onClick={() => setUIStage('bidding')}
                />
                <Button 
                    text="Results"
                    variant={uiStage === 'results' ? 'red' : 'black'}
                    onClick={() => setUIStage('results')}
                />
            </div>
            
            <div className={styles.contentArea}>
                {/* Stage 1: Waiting for players */}
                {uiStage === 'waiting' && (
                    <div className={styles.stageContent}>
                        <div className={styles.rollingStage}>
                            <h2>Waiting for Players...</h2>
                            <div className={styles.playersGrid}>
                                {mockPlayers.map((player) => (
                                    <div key={player.id} className={styles.playerCard}>
                                        <div className={styles.playerCardName}>{player.name}</div>
                                        <div className={styles.playerCardDice}>{player.remainingDice}</div>
                                        <div className={styles.playerCardLabel}>dice</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Stage 2: Rolling dice */}
                {uiStage === 'rolling' && (
                    <div className={styles.stageContent}>
                        <div className={styles.rollingStage}>
                            <h2>Your Turn - Roll Your Dice!</h2>
                            
                            <div className={styles.diceContainer}>
                                <DiceRoll 
                                    diceValues={mockOwnDice} 
                                    isRolling={isRolling}
                                    onRollComplete={() => {}}
                                />
                            </div>
                            
                            {!isRolling && (
                                <Button
                                    text="🎲 Roll!"
                                    variant="red"
                                    onClick={handleRollDice}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Stage 3: Bidding/Claiming */}
                {uiStage === 'bidding' && (
                    <div className={styles.stageContent}>
                        {/* Current Claim Banner - Moved to top */}
                        <div className={styles.claimBanner}>
                            <div className={styles.claimBannerContent}>
                                <span className={styles.claimBannerText}>Current Claim:</span>
                                <div className={styles.claimBannerDice}>
                                    {renderDice(mockCurrentClaim.value, mockCurrentClaim.quantity)}
                                </div>
                                <span className={styles.claimBannerText}>
                                    by {mockPlayers.find(p => p.id === mockCurrentClaim.playerId)?.name}
                                </span>
                            </div>
                        </div>

                        {/* Creative Players Display - Card Grid */}
                        <div className={styles.playersGrid}>
                            {mockPlayers.map((player, index) => (
                                <div key={player.id} className={`${styles.playerCard} ${index === currentPlayerIndex ? styles.currentPlayer : ''}`}>
                                    <div className={styles.playerCardName}>{player.name}</div>
                                    <div className={styles.playerCardDice}>
                                        {Array.from({ length: player.remainingDice }, (_, i) => (
                                            <DiceSvg key={i} value={Math.floor(Math.random() * 6) + 1} size={16} />
                                        ))}
                                    </div>
                                    <div className={styles.playerCardLabel}>{player.remainingDice} dice</div>
                                    {index === currentPlayerIndex && (
                                        <div className={styles.currentPlayerIndicator}>Your Turn</div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Your Dice */}
                        <div className={styles.diceContainer}>
                            <DiceRoll 
                                diceValues={mockOwnDice} 
                                isRolling={false}
                                onRollComplete={() => {}}
                            />
                        </div>

                        {/* Action Buttons - Side by Side */}
                        {isCurrentPlayerTurn() && (
                            <div className={styles.actionButtons}>
                                <Button
                                    text="Make Claim"
                                    variant="black"
                                    onClick={handleOpenClaimModal}
                                />
                                <Button
                                    text="Challenge"
                                    variant="red"
                                    onClick={handleCallLiar}
                                />
                            </div>
                        )}

                        {/* Waiting message when not player's turn */}
                        {!isCurrentPlayerTurn() && (
                            <div className={styles.currentClaim}>
                                <div className={styles.claimText}>
                                    Waiting for {mockPlayers[currentPlayerIndex]?.name}...
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Stage 4: Results */}
                {uiStage === 'results' && (
                    <div className={styles.stageContent}>
                        <h2>Round Results</h2>
                        <div className={styles.currentClaim}>
                            <div className={styles.claimText}>
                                Challenge Results: Alice was correct! Bob loses a die.
                            </div>
                        </div>
                        <Button
                            text="Next Round"
                            variant="red"
                            onClick={() => setUIStage('rolling')}
                        />
                    </div>
                )}
            </div>

            {/* Claim Modal */}
            {showClaimModal && (
                <div className={styles.claimModal}>
                    <div className={styles.claimModalContent}>
                        <h3 className={styles.claimModalTitle}>Make Your Claim</h3>
                        
                        <div className={styles.claimControls}>
                            <div className={styles.claimControl}>
                                <div className={styles.controlLabel}>Quantity</div>
                                <div className={styles.valueDisplay}>
                                    <Button 
                                        text="↓"
                                        variant="black"
                                        onClick={() => setBidQuantity(Math.max(1, bidQuantity - 1))}
                                    />
                                    <span className={styles.valueNumber}>{bidQuantity}</span>
                                    <Button 
                                        text="↑"
                                        variant="black"
                                        onClick={() => setBidQuantity(bidQuantity + 1)}
                                    />
                                </div>
                            </div>
                            
                            <div className={styles.claimControl}>
                                <div className={styles.controlLabel}>Value</div>
                                <div className={styles.valueDisplay}>
                                    <Button 
                                        text="↓"
                                        variant="black"
                                        onClick={() => setBidValue(Math.max(2, bidValue - 1))}
                                    />
                                    <span className={styles.valueNumber}>{bidValue}</span>
                                    <Button 
                                        text="↑"
                                        variant="black"
                                        onClick={() => setBidValue(Math.min(6, bidValue + 1))}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className={styles.claimModalButtons}>
                            <Button
                                text="Submit Claim"
                                variant="red"
                                onClick={handleMakeBid}
                            />
                            <Button
                                text="Cancel"
                                variant="black"
                                onClick={() => setShowClaimModal(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameRoomNewMock;
