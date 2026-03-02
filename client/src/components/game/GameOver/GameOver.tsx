import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { GameService, useGameState, selectIsHost } from '../../../services/gameService';
import { Player } from 'shared/domain';

const pageVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0 },
};

const confettiVariants = {
  initial: { y: -100, opacity: 0 },
  animate: { y: 0, opacity: 1 },
};

const isPlayer = (p: Player | undefined): p is Player => p !== undefined;

const GameOver: React.FC = () => {
  const navigate = useNavigate();
  const players = useGameState(state => state.gameState?.players ?? []);
  // const isHost = useGameState(selectIsHost);
  const myId = useGameState(state => state.playerId);
  const eliminatedPlayerIds = useGameState(state => state.gameState?.eliminatedPlayers ?? []);
  const confettiTriggered = useRef(false);

  const winner = players.find(p => p.remainingDice > 0);
  const isWinner = winner?.id === myId;

  useEffect(() => {
    if (!isWinner || confettiTriggered.current) return;
    confettiTriggered.current = true;

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const colors = ['#a786ff', '#fd8bbc', '#eca184', '#f8deb1', '#26ccff', '#88ff5a'];

    const frame = () => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return;

      confetti({
        particleCount: 3,
        angle: 270,
        spread: 80,
        startVelocity: 25,
        origin: { x: Math.random(), y: -0.1 },
        colors,
        gravity: 0.8,
        ticks: 300,
      });

      requestAnimationFrame(frame);
    };

    frame();
  }, [isWinner]);

  const loserIds = [...eliminatedPlayerIds].reverse();

  const sortedPlayers: Player[] = winner
    ? [winner, ...loserIds.map(id => players.find(p => p.id === id)).filter(isPlayer)]
    : players;

  // const handlePlayAgain = () => {
  //   GameService.resetGame();
  // };

  const handleReturnHome = () => {
    GameService.clearSession();
    navigate('/');
  };

  return (
    <motion.div
      className="flex flex-col items-center gap-8 p-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="text-center"
        variants={confettiVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
      >
        <span className="text-3xl mt-4 font-mono block mb-4">Game Over!</span>
      </motion.div>

      <div className="card w-full max-w-md">
        <h3 className="text-sm font-medium text-text-secondary mb-4">Final Standings</h3>
        <ol className="space-y-3">
          {sortedPlayers.map((player, index) => (
            <motion.li
              key={player.id}
              className="flex items-center justify-between py-2 border-b border-border-light last:border-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                </span>
                <span className="font-medium text-text-primary">{player.name}</span>
              </div>
              <span className="text-sm text-text-secondary">
                {player.remainingDice > 0 ? `${player.remainingDice} dice left` : 'Out'}
              </span>
            </motion.li>
          ))}
        </ol>
      </div>

      <motion.div
        className="text-center"
        variants={confettiVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
      >
      </motion.div>
      <div className="mt-4 flex gap-3">
        {/* {isHost && ( */}
        {/*   <button */}
        {/*     className="btn-primary" */}
        {/*     onClick={handlePlayAgain} */}
        {/*   > */}
        {/*     Play Again */}
        {/*   </button> */}
        {/* )} */}
        <button
          className="btn-primary"
          onClick={handleReturnHome}
        >
          Return Home
        </button>
      </div>
    </motion.div>
  );
};

export default GameOver;
