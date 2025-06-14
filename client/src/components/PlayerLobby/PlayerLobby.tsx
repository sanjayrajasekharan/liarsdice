import React, { useEffect, useState } from "react";
import { useGameState } from "../../store/gameStore";
import styles from "./PlayerLobby.module.css";

const PlayerLobby: React.FC = () => {
    const opponents = useGameState((state) => state.opponents);
    const player = useGameState((state) => state.player);
    // const setOpponents = useGameState((state) => state.updateOpponents);
    // useEffect(() => {
    //     // Simulate player addition with a delay for effect
    //     setTimeout(() => {
    //         setOpponents([
    //             { name: "Sophia", icon: "🦧", remainingDice: 5, dice: [2, 2, 4, 5, 6] },
    //             { name: "Sanjay", icon: "🦍", remainingDice: 4, dice: [1, 3, 3, 5] },
    //         ]);
    //     }, 500);
    // }, [setOpponents]);

    // useEffect(() => {
    //     // Trigger the appearance of each player one by one
    //     opponents.forEach((opponent, index) => {
    //         setTimeout(() => {
    //             setVisiblePlayers((prev) => [...prev, {name: opponent.name, icon: "😀"}]);
    //         }, index * 300); // Staggered appearance
    //     });
    // }, [opponents]);

    return (
        <div className={styles.container}>
            {/* player row */}
            {player && (
                <div className={`${styles.player_row} player_row`}>
                    <div className={styles.icon_container}>
                        <div className={styles.player_icon}>{"😭"}</div>
                    </div>
                    <div className={styles.player_name}>{player.name}<span className={styles.player_indicator}>(you)</span></div>
                </div>
            )}
            {opponents.map((opponent) => (
                <div key={opponent.id} className={`${styles.player_row}`}>
                    <div className={styles.icon_container}>
                        <div className={styles.player_icon}>
                            {opponent.icon}
                        </div>
                    </div>
                    <div className={styles.player_name}>{opponent.name}</div>
                </div>
            ))}
        </div>
    );
};

export default PlayerLobby;
