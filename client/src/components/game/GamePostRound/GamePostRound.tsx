import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useGameState,
  selectChallengeResult,
  selectIsPostRoundReconnect,
  selectNextRoundStartsAt,
  selectForfeitedPlayerId,
} from '../../../services/gameService';
import Reveal from '../../ui/Reveal/Reveal';

const pageVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.05 },
};

const resultVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const GamePostRound: React.FC = () => {
  const isPostRoundReconnect = useGameState(selectIsPostRoundReconnect);
  const [revealComplete, setRevealComplete] = useState(isPostRoundReconnect);
  const challengeResult = useGameState(selectChallengeResult);
  const forfeitedPlayerId = useGameState(selectForfeitedPlayerId);
  const nextRoundStartsAt = useGameState(selectNextRoundStartsAt);
  const playerId = useGameState(state => state.playerId);
  const players = useGameState(state => state.gameState?.players ?? []);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const winnerName = players.find(player => player.id === challengeResult?.winnerId)?.name;
  const forfeitedPlayerName = players.find(player => player.id === forfeitedPlayerId)?.name
    ?? (forfeitedPlayerId ? 'A player' : null);

  useEffect(() => {
    if (!nextRoundStartsAt) {
      setSecondsLeft(null);
      return;
    }

    const tick = () => {
      const diff = Math.max(0, Math.ceil((nextRoundStartsAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nextRoundStartsAt]);

  const isForfeit = forfeitedPlayerId !== null;
  const isChallenge = challengeResult !== null;

  return (
    <motion.div
      className="flex flex-col justify-center items-center gap-6 p-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      {isForfeit && (
        <motion.div
          className="flex flex-col items-center gap-4 p-4 border-2 
                     border-border-light transition-colors duration-200 
                     border-primary-500 bg-primary-50 shadow-md"
          variants={resultVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.4 }}
        >
          <h3 className="text-2xl font-bold text-text-primary">
            {forfeitedPlayerName} ran out of time!
          </h3>
          <p className="text-text-secondary">
            They lose a die for this round.
          </p>
        </motion.div>
      )}

      {isChallenge && (
        <>
          <div className="w-full">
            <Reveal
              playerCounts={challengeResult.playerCounts}
              claimedFace={challengeResult.claimedFace}
              actualTotal={challengeResult.actualTotal}
              currentPlayerId={playerId}
              skipAnimation={isPostRoundReconnect}
              onAnimationComplete={() => setRevealComplete(true)}
            />
          </div>

          <AnimatePresence>
            {revealComplete && (
              <motion.div
                className="flex flex-col items-center gap-4"
                variants={resultVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.4 }}
              >
                <h3 className="text-xl font-mono">{winnerName} wins!</h3>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {secondsLeft !== null && secondsLeft > 0 && (isForfeit || revealComplete) && (
        <motion.p
          className="text-text-secondary text-center mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Next round starts in {secondsLeft}...
        </motion.p>
      )}
    </motion.div>
  );
};

export default GamePostRound;
