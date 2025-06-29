import React, { useState } from "react";
import { motion, PanInfo } from "framer-motion";
import clsx from "clsx";
import styles from "./ClaimStack.module.css";

import oneSvg from "../../assets/dice/one.svg?url";
import twoSvg from "../../assets/dice/two.svg?url";
import threeSvg from "../../assets/dice/three.svg?url";
import fourSvg from "../../assets/dice/four.svg?url";
import fiveSvg from "../../assets/dice/five.svg?url";
import sixSvg from "../../assets/dice/six.svg?url";

import reactLogo from "../../assets/react.svg"; 

interface Claim {
    value: number;
    quantity: number;
    userName: string;
}

interface ClaimStackProps {
    claims: Claim[];
}

const diceSvgs: Record<number, string> = {
    1: oneSvg,
    2: twoSvg,
    3: threeSvg,
    4: fourSvg,
    5: fiveSvg,
    6: sixSvg,
};

const ClaimStack: React.FC<ClaimStackProps> = ({ claims }) => {
    const [focusedIndex, setFocusedIndex] = useState(claims.length - 1); // Start with the latest claim

    const handlePrevious = React.useCallback(() => {
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    }, []);

    const handleNext = React.useCallback(() => {
        setFocusedIndex((prev) => (prev < claims.length - 1 ? prev + 1 : prev));
    }, [claims.length]);

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowUp") {
                handlePrevious();
            } else if (event.key === "ArrowDown") {
                handleNext();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleNext, handlePrevious]);

    React.useEffect(() => {
        setFocusedIndex(claims.length - 1);
    }, [claims]);

    if (!claims || claims.length === 0) {
        return null;
    }

    const handleSwipe = (_: unknown, info: PanInfo) => {
        const swipeThreshold = 50;
        if (info.offset.y > swipeThreshold) {
            handlePrevious();
        } else if (info.offset.y < -swipeThreshold) {
            handleNext();
        }
    };

    const handleCardClick = (index: number) => {
        setFocusedIndex(index);
    };

    // Only render up to 5 cards: focused and 2 above/below
    const renderRange = 2;
    const visibleCards: { claim: Claim; index: number; slot: number }[] = [];
    for (let slot = -renderRange; slot <= renderRange; slot++) {
        const claimIndex = focusedIndex + slot;
        if (claimIndex >= 0 && claimIndex < claims.length) {
            visibleCards.push({ claim: claims[claimIndex], index: claimIndex, slot });
        }
    }

    return (
        <div className={styles.stackContainer}>
            {/* Navigation */}
            {/* Claims Stack */}
            <div className={styles.claimsWrapper}>
                {visibleCards.map(({ claim, index, slot }) => {
                    console.log(`Rendering claim  ${claim} with slot ${slot}`);
                    const isFocused = slot === 0;
                    const distanceFromFocus = Math.abs(slot);
                    const stackOffset = 12;
                    const yOffset = slot * stackOffset;
                    const zIndex = claims.length - distanceFromFocus;
                    return (
                        <motion.div
                            key={`${claim.userName}-${claim.value}-${claim.quantity}-${index}`}
                            className={clsx(styles.claimCard, {
                                [styles.focusedCard]: isFocused,
                                [styles.stackedCard]: !isFocused
                            })}
                            initial={slot < 0 ? { y: 40, opacity: 0, zIndex: -1, scale: 0 } : { y: -40, opacity: 0, zIndex: -1, scale: 0 }}
                            animate={{
                                y: `calc(${yOffset}px - 50%)`,
                                scale: isFocused ? 1 : 0.95 - distanceFromFocus * 0.05,
                                // opacity: isFocused ? 1 : 0.8,
                                opacity: 1,
                                zIndex
                            }}
                            exit={{ opacity: 0, y: 40 }}
                            transition={{
                                default : {
                                    duration: 0.3,
                                    ease: "easeOut"
                                },
                                scale : { duration: 0.2, ease: "easeInOut" }
                            }}
                            onPan={isFocused ? handleSwipe : undefined}
                            onClick={() => handleCardClick(index)}
                        >
                            <div className={styles.user}>
                                <div className={styles.userImage} style={{ backgroundImage: `url(${reactLogo})` }}> </div>
                                <h3 className={styles.userName}>{claim.userName}</h3>
                            </div>

                            <div className={styles.claim}>
                                <div className={styles.claimQuantity}>
                                    <div className={clsx(styles.claimQuantityValue, styles.value)}>
                                        {claim.quantity}
                                    </div>
                                    <h4 className={clsx(styles.claimQuantityLabel, styles.label)}>Quantity</h4>
                                </div>
                                <div className={styles.claimDie}>
                                    <div className={clsx(styles.claimDieValue, styles.value)}>
                                        <img className={styles.dieImage} src={diceSvgs[claim.value]} alt={`Dice ${claim.value}`} />
                                    </div>
                                    <h4 className={clsx(styles.claimDieLabel, styles.label)}>Die</h4>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default ClaimStack;
