import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import styles from "./DiceRoll.module.css";

// Import dice SVGs
import oneSvg from "../../assets/dice/one.svg?url";
import twoSvg from "../../assets/dice/two.svg?url";
import threeSvg from "../../assets/dice/three.svg?url";
import fourSvg from "../../assets/dice/four.svg?url";
import fiveSvg from "../../assets/dice/five.svg?url";
import sixSvg from "../../assets/dice/six.svg?url";

interface DiceRollProps {
    diceValues: number[]; // The actual dice values from server
    isRolling?: boolean; // Whether to show rolling animation
    onRollComplete?: () => void; // Callback when roll animation finishes
}

// Dice SVG mapping
const diceSvgs: Record<number, string> = {
    1: oneSvg,
    2: twoSvg,
    3: threeSvg,
    4: fourSvg,
    5: fiveSvg,
    6: sixSvg,
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
                            ? { duration: 0.3, repeat: Infinity }
                            : { duration: 0 }
                    }
                >
                    <img
                        src={diceSvgs[tempDiceValues[index] || 1]}
                        alt={`Die showing ${tempDiceValues[index] || 1}`}
                        className={styles.diceSvg}
                    />
                </motion.div>
            ))}
        </div>
    );
};

export default DiceRoll;
