import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GameService,
  useGameState,
  selectChallengeResult,
} from '../../../services/gameService';
import Reveal from '../../ui/Reveal/Reveal';

interface GamePostRoundProps {
  isHost: boolean;
}

const pageVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.05 },
};

const resultVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const GamePostRound: React.FC<GamePostRoundProps> = ({ isHost }) => {
  const [revealComplete, setRevealComplete] = useState(false);
  const challengeResult = useGameState(selectChallengeResult);
  const playerId = useGameState(state => state.playerId);
  const winnerName = useGameState(state => state.gameState)?.players.filter(player => player.id === challengeResult?.winnerId)[0]?.name;

  const handleStartNextRound = () => {
    GameService.startRound();
  };

  return (
    <motion.div
      className="flex flex-col items-center gap-6 p-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >

      {challengeResult && (
        <>
          <div className="w-full">
            <Reveal
              playerCounts={challengeResult.playerCounts}
              claimedFace={challengeResult.claimedFace}
              actualTotal={challengeResult.actualTotal}
              currentPlayerId={playerId}
              onAnimationComplete={() => setRevealComplete(true)}
            />
          </div>
        </>
      )}

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

            {isHost && (
              <div className="mt-4">
                <button
                  className="btn-primary"
                  onClick={handleStartNextRound}
                >
                  Start Next Round
                </button>
              </div>
            )}

            {!isHost && (
              <p className="text-text-secondary text-center">
                Waiting for host to start next round...
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GamePostRound;
