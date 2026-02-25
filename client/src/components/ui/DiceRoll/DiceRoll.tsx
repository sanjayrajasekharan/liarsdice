import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

// Import dice SVGs
import oneSvg from "../../../assets/dice/one.svg?url";
import twoSvg from "../../../assets/dice/two.svg?url";
import threeSvg from "../../../assets/dice/three.svg?url";
import fourSvg from "../../../assets/dice/four.svg?url";
import fiveSvg from "../../../assets/dice/five.svg?url";
import sixSvg from "../../../assets/dice/six.svg?url";

interface DiceRollProps {
  dice: number[]; // The actual dice values from server (alias: diceValues also accepted)
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
  dice,
  isRolling = false,
  onRollComplete
}) => {
  const [tempDiceValues, setTempDiceValues] = useState<number[]>(dice);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationInterval = useRef<number | null>(null);

  useEffect(() => {
    if (isRolling && dice.length > 0) {
      setIsAnimating(true);

      // Start the shuffling animation - keep the original interval logic
      animationInterval.current = window.setInterval(() => {
        setTempDiceValues(
          Array(dice.length)
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
        setTempDiceValues(dice);
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
      setTempDiceValues(dice);
      setIsAnimating(false);
    }
  }, [isRolling, dice, onRollComplete]);

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 p-2">
      {Array.from({ length: dice.length }).map((_, index) => (
        <motion.div
          key={index}
          className="flex items-center justify-center"
          animate={
            isAnimating ? { scale: [1, 1.1, 1] } : { scale: 1 }
          }
          transition={
            isAnimating
              ? { duration: 0.3, repeat: Infinity }
              : { duration: 0 }
          }
        >
          <img
            src={diceSvgs[tempDiceValues[index] || 1]}
            alt={`Die showing ${tempDiceValues[index] || 1}`}
            className="h-8 w-8 sm:h-12 sm:w-12"
          />
        </motion.div>
      ))}
    </div>
  );
};

export default DiceRoll;
