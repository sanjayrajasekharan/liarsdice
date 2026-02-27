import React from 'react';
import { motion } from "framer-motion";
import clsx from 'clsx';
import { DieFace, PlayerDiceCount } from 'shared/domain';
import { diceSvgs } from "../../../assets/dice";
import { containerVariants, rowVariants, diceContainerVariants, dieVariants, eggVariants, footerVariants } from './transitions';

interface RevealProps {
  playerCounts: PlayerDiceCount[];
  claimedFace: DieFace;
  actualTotal: number;
  currentPlayerId: string | null;
  onAnimationComplete?: () => void;
}

const Reveal: React.FC<RevealProps> = ({ playerCounts, claimedFace, actualTotal, currentPlayerId, onAnimationComplete }) => {
  return (
    <motion.div
      className="w-full max-w-lg mx-auto rounded-xl overflow-hidden border border-border-light bg-surface-elevated shadow-lg"
      variants={containerVariants}
      initial="hidden"
      animate="show"
      onAnimationComplete={onAnimationComplete}
    >
      {playerCounts.map((player, index) => (
        <motion.div
          className={clsx(
            "flex items-center justify-between px-4 py-3 border-b border-border-light",
            index % 2 !== 0 && "bg-surface-secondary"
          )}
          key={player.playerId}
          variants={rowVariants}
        >
          <h3 className="text-sm font-medium text-text-primary min-w-24">
            {player.playerName} {player.playerId === currentPlayerId && "(You)"}
          </h3>
          <motion.div
            className="flex items-center gap-1"
            variants={diceContainerVariants}
          >
            {player.count > 0 ? (
              Array.from({ length: player.count }).map((_, i) => (
                <motion.img
                  key={i}
                  className="h-6 w-6"
                  src={diceSvgs[claimedFace]}
                  alt={`Die showing ${claimedFace}`}
                  variants={dieVariants}
                />
              ))
            ) : (
              <motion.span
                className="text-text-tertiary text-sm"
                variants={eggVariants}
              >
                -
              </motion.span>
            )}
          </motion.div>
        </motion.div>
      ))}

      <div className="px-4 py-3 bg-surface-secondary border-t border-border-light">
        <motion.div variants={footerVariants} className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-secondary">
            Total {claimedFace}s
          </h3>
          <h3 className="text-lg font-bold text-primary-600">
            {actualTotal}
          </h3>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Reveal;
