import React from 'react';
import { motion } from 'framer-motion';
import { GameService, useGameState } from '../../../services/gameService';
import Lobby from '../../ui/Lobby/Lobby';

interface GameLobbyProps {
  isHost: boolean;
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const GameLobby: React.FC<GameLobbyProps> = ({ isHost }) => {
  const playerId = useGameState(state => state.playerId);
  const players = useGameState(state => state.gameState?.players ?? []);
  const hostId = useGameState(state => state.gameState?.hostId);

  const lobbyPlayers = players.map(player => ({
    name: player.name,
    isHost: player.id === hostId,
    isPlayer: player.id === playerId,
  }));

  const handleStartGame = () => {
    GameService.startGame();
  };

  return (
    <motion.div
      className="flex flex-col items-center gap-8 p-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <Lobby
        players={lobbyPlayers}
        onStartGame={handleStartGame}
        maxPlayers={6}
      />

      {isHost && players.length >= 2 && (
        <div className="mt-4">
          <button
            onClick={handleStartGame}
            className="btn-primary"
          >
            Start Game
          </button>
        </div>
      )}

      {isHost && players.length < 2 && (
        <p className="text-text-secondary text-center">
          Waiting for at least 2 players to start...
        </p>
      )}

      {!isHost && (
        <p className="text-text-secondary text-center">
          Waiting for host to start the game...
        </p>
      )}
    </motion.div>
  );
};

export default GameLobby;
