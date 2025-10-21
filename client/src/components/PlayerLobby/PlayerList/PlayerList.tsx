import React from "react";
import styles from "./PlayerLobby.module.css";

interface PlayerListProps {
    players: Array<{
        id: string;
        name: string;
        isHost?: boolean;
    }>;
    userId: string;
}

const PlayerList: React.FC<PlayerListProps> = ({ players,  userId }) => {
    return (
        <div className={styles.container}>
            {players.map((player) => {
                const isCurrentPlayer = player.id === userId;

                return (
                    <div key={player.id} className={`${styles.player_row} ${styles.show}`}>
                        <div className={styles.icon_container}>
                            <div className={styles.player_icon}>
                                {player.isHost ? "👑" : "🎲"}
                            </div>
                        </div>
                        <div className={styles.player_name}>
                            {player.name}
                            {isCurrentPlayer && (
                                <span className={styles.player_indicator}>(you)</span>
                            )}
                            {player.isHost && (
                                <span className={`${styles.player_indicator} ${styles.host}`}>host</span>
                            )}
                        </div>
                    </div>
                );
            })}
            
            {players.length === 0 && (
                <div className={`${styles.player_row} ${styles.loading}`}>
                    <div className={styles.icon_container}>
                        <div className={styles.player_icon}>⏳</div>
                    </div>
                    <div className={styles.player_name}>Waiting for players to join...</div>
                </div>
            )}
        </div>
    );
};

export default PlayerList;
