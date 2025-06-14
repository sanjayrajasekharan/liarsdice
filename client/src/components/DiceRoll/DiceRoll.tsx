import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import styles from "./DiceRoll.module.css"; // Import module CSS

interface DiceRollerProps {
    numDice: number; // 1 to 6
    diceValues: number[];
    rolling: boolean;
}


// Standard die face values (3x3 grid)
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

const DiceRoller: React.FC<DiceRollerProps> = ({
    numDice,
    diceValues,
    rolling,
}) => {
    const [tempDiceValues, setTempDiceValues] = useState<number[]>(
        Array(numDice).fill(1)
    );
    const animationInterval = useRef<number | null>(null);

    useEffect(() => {
        if (rolling) {
            animationInterval.current = window.setInterval(() => {
                setTempDiceValues(
                    Array(numDice)
                        .fill(0)
                        .map(() => Math.floor(Math.random() * 6) + 1)
                );
            }, 100); // Smooth face change

            // const timeout = window.setTimeout(() => {
            //     clearInterval(interval);
            //     setTempDiceValues(diceValues);
            //     setRolling(false);
            // }, 2000); // Stop after 2 seconds

        if (!rolling && diceValues.length == numDice) {
            if (animationInterval.current)
                clearInterval(animationInterval.current);
            setTempDiceValues(diceValues);
        }
            return () => {
                if (animationInterval.current) {
                    clearInterval(animationInterval.current);
                }
                // clearTimeout(timeout);
            };
        }

    }, [rolling, diceValues]);

    let diceIndex = 0; // Track which dice to plac

    console.log(numDice);

    // console.log(diceLayouts);
    return (
        <div className={styles.diceContainer}>
            {
            
            Array.from({ length: numDice }).map((_, index) => ( 
                <motion.div
                key={index}
                className={styles.dice}
                            animate={
                                rolling ? { scale: [1, 1.1, 1] } : { scale: 1 }
                            } // Subtle scale effect
                            transition={
                                rolling
                                    ? { duration: 0.2, repeat: Infinity }
                                    : { duration: 0 }
                            }
                        >
                            <div className={styles.diceFace}>
                    {dieFaces[tempDiceValues[index]].map((faceRow, faceRowIndex) =>
                        faceRow.map((dot, faceColIndex) => (
                            <div
                                key={`${faceRowIndex}-${faceColIndex}`}
                                className={`${styles.dot} ${dot ? styles.activeDot : ""}`}
                            />
                        ))
                    )}
                </div>
            </motion.div>
             
                    ) 
                
            )}
        </div>
    );
};

export default DiceRoller;
