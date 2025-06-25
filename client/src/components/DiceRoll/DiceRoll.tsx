import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import styles from "./DiceRoll.module.css";

interface DiceRollProps {
    diceValues: number[]; // The actual dice values from server
    isRolling?: boolean; // Whether to show rolling animation
    onRollComplete?: () => void; // Callback when roll animation finishes
}

// Standard die face dot patterns (3x3 grid)
const dieFaces: Record<number, number[][]> = {
    1: [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
    ],
    2: [
        [1, 0, 0],
        [0, 0, 0],
        [0, 0, 1],
    ],
    3: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
    ],
    4: [
        [1, 0, 1],
        [0, 0, 0],
        [1, 0, 1],
    ],
    5: [
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1],
    ],
    6: [
        [1, 0, 1],
        [1, 0, 1],
        [1, 0, 1],
    ],
};

const DiceRoll: React.FC<DiceRollProps> = ({ 
    diceValues, 
    isRolling = false, 
    onRollComplete 
}) => {
    const [tempDiceValues, setTempDiceValues] = useState<number[]>(diceValues);
    const [isAnimating, setIsAnimating] = useState(false);
    const animationInterval = useRef<number | null>(null);

    useEffect(() => {
        if (isRolling && diceValues.length > 0) {
            setIsAnimating(true);
            
            // Start the shuffling animation - keep the original interval logic
            animationInterval.current = window.setInterval(() => {
                setTempDiceValues(
                    Array(diceValues.length)
                        .fill(0)
                        .map(() => Math.floor(Math.random() * 6) + 1)
                );
            }, 100); // Smooth face change every 100ms

            // Stop rolling and reveal actual values after 2 seconds
            const timeout = window.setTimeout(() => {
                if (animationInterval.current) {
                    clearInterval(animationInterval.current);
                }
                
                // Set the actual dice values from server
                setTempDiceValues(diceValues);
                setIsAnimating(false);
                
                // Trigger completion callback after a short delay
                setTimeout(() => {
                    onRollComplete?.();
                }, 300);
            }, 2000);

            return () => {
                if (animationInterval.current) {
                    clearInterval(animationInterval.current);
                }
                clearTimeout(timeout);
            };
        } else {
            // Not rolling, just show the actual values
            if (animationInterval.current) {
                clearInterval(animationInterval.current);
            }
            setTempDiceValues(diceValues);
            setIsAnimating(false);
        }
    }, [isRolling, diceValues, onRollComplete]);

    return (
        <div className={styles.diceContainer}>
            {Array.from({ length: diceValues.length }).map((_, index) => (
                <motion.div
                    key={index}
                    className={styles.dice}
                    animate={
                        isAnimating ? { scale: [1, 1.1, 1] } : { scale: 1 }
                    } // Keep the original subtle scale effect
                    transition={
                        isAnimating
                            ? { duration: 0.2, repeat: Infinity }
                            : { duration: 0 }
                    }
                >
                    <div className={styles.diceFace}>
                        {dieFaces[tempDiceValues[index] || 1].map((faceRow, faceRowIndex) =>
                            faceRow.map((dot, faceColIndex) => (
                                <div
                                    key={`${faceRowIndex}-${faceColIndex}`}
                                    className={`${styles.dot} ${dot ? styles.activeDot : ""}`}
                                />
                            ))
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default DiceRoll;
