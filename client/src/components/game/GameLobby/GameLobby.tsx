import React from 'react';
import { motion } from 'framer-motion';
import { GameService, useGameState } from '../../../services/gameService';
import Lobby from '../../ui/Lobby/Lobby';
import Settings from '../../ui/SettingsDialog/Settings';
import { toast } from '@store/toastStore';


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
  const gameCode = useGameState(state => state.gameCode);

  const lobbyPlayers = players.map(player => ({
    id: player.id,
    name: player.name,
    isHost: player.id === hostId,
    isPlayer: player.id === playerId,
  }));

  const handleStartGame = () => {
    GameService.startGame();
  };

  const handleReorder = (playerIds: string[]) => {
    GameService.reorderPlayers(playerIds);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/game/${gameCode}`;
    const shareData = {
      title: "Join my Liar's Dice game!",
      text: `Use code ${gameCode} to join`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          await copyToClipboard(shareUrl);
        }
      }
    } else {
      await copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
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
        onReorder={handleReorder}
        isHost={isHost}
        maxPlayers={6}
      />

      <div className="flex items-center gap-4">
        {isHost && (
          <Settings />
        )}

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Share Invite Link
        </button>
      </div>

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
