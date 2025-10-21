import React from 'react';
import { motion } from "framer-motion";

import styles from "./Lobby.module.css"
import { clsx } from 'clsx';
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
    // Create an array of exactly maxPlayers length with players and empty slots
    const playerSlots = Array.from({ length: maxPlayers }, (_, index) => {
        const player = players[index];
        return player || null; // null for empty slots
    });

    return (
        <div className={styles.lobbyContainer}>
            <motion.div 
                className={styles.table}
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                {
                    playerSlots.map((player, index) => (
                        <motion.div 
                            key={index} 
                            className={clsx(styles.row, {[styles.oddRow]: index % 2 !== 0})}
                            variants={rowVariants}
                            animate={player ? "show" : "empty"}
                        >
                            <motion.div 
                                key={player ? `player-${player.name}` : `empty-${index}`}
                                className={styles.playerInfo}
                                variants={playerInfoVariants}
                                initial={player ? "hidden" : "empty"}
                                animate={player ? "show" : "empty"}
                            >
                                <h3 className={clsx(styles.playerName, { [styles.emptySlot]: !player })}>
                                    {player ? player.name: ""}
                                </h3>
                            </motion.div>
                            {player?.isHost && (
                                <motion.span 
                                    className={styles.hostBadge}
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