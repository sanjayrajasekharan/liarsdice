import React from "react";
import styles from "./PlayersDisplay.module.css";
import clsx from "clsx";

interface PlayersDisplayProps {
    players: Record<string, number>;
    userPlayerIndex: number;
    currentPlayerIndex: number;
}

const PlayersDisplay: React.FC<PlayersDisplayProps> = ({ players, userPlayerIndex, currentPlayerIndex }) => {
    const playerEntries = Object.entries(players);
    return (
        <div className={styles.playersRow}>
            {playerEntries.map(([name, count], idx) => (
                <div
                    key={name}
                    className={clsx(
                        styles.player,
                        idx === userPlayerIndex && styles.userPlayer,
                        idx === currentPlayerIndex && styles.currentPlayer
                    )}
                >
                    <span className={styles.playerName}>{name} {idx === userPlayerIndex && " (You)"}</span>
                    <span className={styles.diceCount}>{count}</span>
                </div>
            ))}
        </div>
    );
};

export default PlayersDisplay;
