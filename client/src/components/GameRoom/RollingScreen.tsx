import React from "react";
import Button from "../Button/Button";
import DiceRoll from "../DiceRoll/DiceRoll";
import styles from "./GameRoom.module.css";

interface RollingScreenProps {
    playerDice: number[];
    isRolling: boolean;
    onRollDice: () => void;
    onRollComplete: () => void;
}

const RollingScreen: React.FC<RollingScreenProps> = ({
    playerDice,
    isRolling,
    onRollDice,
    onRollComplete
}) => {
    return (
        <div className={styles.mobileGameContainer}>
            {/* Rolling Screen - Hyper simple: just dice and button */}
            <div className={styles.rollingScreen}>
                {/* Dice Display */}
                <div className={styles.diceContainer}>
                    <DiceRoll 
                        diceValues={playerDice} 
                        isRolling={isRolling}
                        onRollComplete={onRollComplete}
                    />
                </div>
                
                {/* Roll Button - Hide during animation */}
                {!isRolling && (
                    <div className={styles.rollAction}>
                        <Button
                            onClick={onRollDice}
                            text="🎲 Roll Dice"
                            variant="red"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default RollingScreen;
