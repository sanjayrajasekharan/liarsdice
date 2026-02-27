import React from 'react';
import { motion } from "framer-motion";
import clsx from 'clsx';
import { containerVariants, rowVariants, playerInfoVariants, badgeVariants } from './transitions';

interface Player {
  name: string;
  isHost: boolean;
  isPlayer: boolean
}

interface LobbyProps {
  players: Player[];
  onStartGame: () => void;
  maxPlayers?: number;
}

const Lobby: React.FC<LobbyProps> = ({ players, onStartGame, maxPlayers = 6 }) => {
  void onStartGame; // Currently unused but part of props interface
  const playerSlots = Array.from({ length: maxPlayers }, (_, index) => {
    if (index < players.length) return players[index];
    return null; // null for empty slots
  });

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        className="flex flex-col rounded-xl overflow-hidden border border-border-light bg-surface-elevated shadow-lg"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {
          playerSlots.map((player, index) => (
            <motion.div
              key={index}
              className={clsx(
                "flex items-center justify-between px-4 py-3 border-b border-border-light last:border-b-0",
                index % 2 !== 0 && "bg-surface-secondary"
              )}
              variants={rowVariants}
              animate={player ? "show" : "empty"}
            >
              <motion.div
                key={player ? `player-${player.name}` : `empty-${index}`}
                className="flex-1 min-h-[24px]"
                variants={playerInfoVariants}
                initial={player ? "hidden" : "empty"}
                animate={player ? "show" : "empty"}
              >
                <h3 className={clsx(
                  "text-base font-medium",
                  player ? "text-text-primary" : "text-text-tertiary"
                )}>
                  {player ? player.name : ""}
                </h3>
              </motion.div>
              {player?.isHost && (
                <motion.span
                  className="text-lg"
                  variants={badgeVariants}
                  initial="hidden"
                  animate="show"
                >
                  👑
                </motion.span>
              )}
            </motion.div>
          ))
        }
      </motion.div>
    </div>
  );
};

export default Lobby;
