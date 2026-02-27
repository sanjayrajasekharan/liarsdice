import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GameService,
  useGameState,
  selectIsMyTurn,
  selectCanChallenge,
  selectClaimHistory,
  selectCurrentPlayer,
  selectMyPlayerInfo,
} from '../../../services/gameService';
import { DieFace } from 'shared/domain';
import DiceRoll from '../../ui/DiceRoll/DiceRoll';
import PlayersDisplay, { Player } from '../../ui/PlayersDisplay/PlayersDisplay';
import ClaimInput from '../../ui/ClaimInput/ClaimInput';
import ClaimTimeline from '../../ui/ClaimTimeline/ClaimTimeline';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const GameRound: React.FC = () => {
  const myDice = useGameState(state => state.myDice);
  const isRolling = useGameState(state => state.isRolling);
  const setIsRolling = useGameState(state => state.setIsRolling);
  const currentClaim = useGameState(state => state.currentClaim);
  const players = useGameState(state => state.gameState?.players ?? []);
  const currentPlayer = useGameState(selectCurrentPlayer);
  const isMyTurn = useGameState(selectIsMyTurn);
  const canChallenge = useGameState(selectCanChallenge);
  const playerId = useGameState(state => state.playerId);
  const claimHistory = useGameState(selectClaimHistory);
  const myPlayerInfo = useGameState(selectMyPlayerInfo);
  const [showRound, setShowRound] = useState(false);

  const [isClaimInputOpen, setIsClaimInputOpen] = useState(false);

  const displayPlayers: Player[] = players.map(player => ({
    id: player.id,
    name: player.name,
    diceCount: player.remainingDice,
    isCurrentTurn: player.id === currentPlayer?.id,
    isUser: player.id === playerId,
  }));

  const handleMakeClaim = (quantity: number, faceValue: DieFace) => {
    GameService.makeClaim(quantity, faceValue);
  };

  const handleChallenge = () => {
    GameService.challenge();
  };

  useEffect(() => {
    if (isRolling) {
      const timer = setTimeout(() => {
        setIsRolling(false);
      }, 2000); // Match this duration with the rolling animation duration

      return () => clearTimeout(timer);
    }
    if (!isRolling) {
      const timer = setTimeout(() => {
        setShowRound(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isRolling, setIsRolling]);

  if (!showRound) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          className="flex flex-col h-full items-center justify-center p-4"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          <DiceRoll dice={myDice} isRolling={true} />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (showRound) {
    return (
      <motion.div
        className="flex flex-col h-full overflow-hidden p-4"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        <div className="flex-1 min-h-0 flex flex-col justify-evenly overflow-hidden">
          <ClaimTimeline
            currentClaim={currentClaim}
            claimHistory={claimHistory}
            currentPlayerId={playerId}
          />

          <PlayersDisplay
            players={displayPlayers}
            claimHistory={claimHistory}
          />

          <div className="card flex items-center justify-center py-3 sm:py-6">
            <DiceRoll dice={myDice} />
          </div>
        </div>

        <div className="shrink-0 pt-4 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isMyTurn ? (
              <motion.div
                key="your-turn"
                className="flex flex-wrap gap-3 w-full justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.button
                  className="btn-primary flex-1 min-w-[140px]"
                  onClick={() => setIsClaimInputOpen(true)}
                  whileTap={{ scale: 0.98 }}
                >
                  Make a Claim
                </motion.button>

                {canChallenge && (
                  <motion.button
                    className="btn-secondary flex-1 min-w-[140px]"
                    onClick={handleChallenge}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Challenge!
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ClaimInput
          isOpen={isClaimInputOpen}
          currentDieValue={currentClaim?.faceValue ?? 1}
          currentCount={currentClaim?.quantity ?? 0}
          onClose={() => setIsClaimInputOpen(false)}
          onSubmit={(faceValue, count) => handleMakeClaim(count, faceValue as DieFace)}
        />
      </motion.div>
    );
  }
};

export default GameRound;
