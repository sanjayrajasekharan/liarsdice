import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GameService, useGameState } from '../../../services/gameService';
import Lobby from '../../ui/Lobby/Lobby';
import SettingsDialog from '../../ui/SettingsDialog/SettingsDialog';
import { toast } from '@store/toastStore';
import { DEFAULT_GAME_SETTINGS, GameSettings } from 'shared/domain';

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
  const settings = useGameState(state => state.gameState?.settings ?? DEFAULT_GAME_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    const shareUrl = `${window.location.origin}/join?code=${gameCode}`;
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

  const handleSaveSettings = (changes: Partial<GameSettings>) => {
    GameService.updateSettings(changes);
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
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Game settings"
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
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Settings
          </button>
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

      {isHost && (
        <SettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentSettings={settings}
          onSave={handleSaveSettings}
        />
      )}
    </motion.div>
  );
};

export default GameLobby;
