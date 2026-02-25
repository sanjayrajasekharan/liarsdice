import React from 'react';
import { motion } from 'framer-motion';
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

const GamePostRound: React.FC<GamePostRoundProps> = ({ isHost }) => {
  const challengeResult = useGameState(selectChallengeResult);
  const playerId = useGameState(state => state.playerId);

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
      <h2 className="text-2xl font-bold text-text-primary">Round Over!</h2>

      {challengeResult && (
        <>
          <div className="w-full">
            <Reveal
              playerCounts={challengeResult.playerCounts}
              claimedFace={challengeResult.claimedFace}
              actualTotal={challengeResult.actualTotal}
              currentPlayerId={playerId}
            />
          </div>
        </>
      )}

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
  );
};

export default GamePostRound;
