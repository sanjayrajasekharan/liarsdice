import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

interface TurnTimerProps {
  deadline: Date | null;
}

const TurnTimer: React.FC<TurnTimerProps> = ({ deadline }) => {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) {
      setSecondsLeft(null);
      return;
    }

    const tick = () => {
      const diff = Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (secondsLeft === null) return null;

  const isLow = secondsLeft < 10;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <motion.span
      className={clsx(
        "text-xs font-mono tabular-nums",
        isLow ? "text-red-600" : "text-text-secondary"
      )}
      animate={isLow ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
      transition={isLow ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" } : undefined}
    >
      {minutes}:{seconds.toString().padStart(2, "0")}
    </motion.span>
  );
};

export default TurnTimer;
