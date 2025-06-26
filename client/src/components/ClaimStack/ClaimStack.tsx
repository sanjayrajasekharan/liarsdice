import React, { useState } from "react";
import { motion, PanInfo } from "framer-motion";
import styles from "./ClaimStack.module.css";

import oneSvg from "../../assets/dice/one.svg?url";
import twoSvg from "../../assets/dice/two.svg?url";
import threeSvg from "../../assets/dice/three.svg?url";
import fourSvg from "../../assets/dice/four.svg?url";
import fiveSvg from "../../assets/dice/five.svg?url";
import sixSvg from "../../assets/dice/six.svg?url";

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
                    const isFocused = slot === 0;
                    const distanceFromFocus = Math.abs(slot);
                    const minOffset = 5;
                    const maxOffset = 15;
                    const stackOffset = Math.max(
                        minOffset,
                        maxOffset - (claims.length - 2)
                    );
                    const yOffset = slot * stackOffset;
                    const zIndex = claims.length - distanceFromFocus;
                    return (
                        <motion.div
                            key={`${claim.userName}-${claim.value}-${claim.quantity}-${index}`}
                            className={`${styles.claimCard} ${isFocused ? styles.focusedCard : styles.stackedCard}`}
                            style={{ zIndex }}
                            initial={{ y: -40, opacity: 0 }}
                            animate={{
                                y: `calc(${yOffset}px - 50%)`,
                                scale: isFocused ? 1 : 0.95 - distanceFromFocus * 0.05,
                                opacity: isFocused ? 1 : 0.8,
                            }}
                            exit={{ opacity: 0, y: 40 }}
                            transition={{
                                duration: 0.3,
                                ease: "easeOut"
                            }}
                            onPan={isFocused ? handleSwipe : undefined}
                            onClick={() => handleCardClick(index)}
                        >
                            <div className={styles.claim}>
                                <span className={styles.quantity}>{claim.quantity} ×</span>
                                {diceSvgs[claim.value] && (
                                    <img
                                        className={styles.dieImage}
                                        src={diceSvgs[claim.value]}
                                        alt={`Die showing ${claim.value}`}
                                    />
                                )}
                            </div>
                            <div className={styles.userName}>
                                -- {claim.userName}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default ClaimStack;
