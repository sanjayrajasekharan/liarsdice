import React, {useEffect, useState} from "react";
import UserController from "../../components/UserController/UserController";
import UserDisplay from "../../components/UserDisplay";
import styles from "./Table.module.css";
import { GameService } from "../../services/gameService";
interface GameTableProps {
    user: { name: string; icon: string, numDice: number };
    opponents: { name: string; icon: string, numDice: number }[];
}

const GameTable: React.FC<GameTableProps> = ({ user, opponents }) => {
    const numOpponents = Math.min(Math.max(opponents.length, 1), 5); // Ensures 1-5 opponents

    // Circle radius for positioning opponents
    const [radius, setRadius] = useState(0);

    useEffect(() => {
        const updateRadius = () => {
            const minDimension = Math.min(window.innerWidth, window.innerHeight);
            setRadius(minDimension * 0.4

            ); // 35% of the smallest dimension
        };

        updateRadius();
        window.addEventListener("resize", updateRadius);
        return () => window.removeEventListener("resize", updateRadius);
    }, []);
    const startAngle = -90; // Start directly above the user
    const angleStep = 180 / (numOpponents + 1); // Distribute evenly

    return (
        <div className={styles.table}>
            {/* User is always in the center */}
            <div className={styles.userCenter}>
                <UserController isUser = {true} userName={user.name} userIcon={user.icon} numDice={user.numDice} />
            </div>

            {/* Opponents dynamically positioned in the upper half-circle */}
            {opponents.slice(0, numOpponents).map((opponent, index) => {
                const angle = startAngle + angleStep * (index + 1); // Compute angle for each player
                const x = `calc(75% - ${Math.cos(angle * (Math.PI / 180)) * 50}%)`; // Corrected X coordinate
                const y = `calc(50% - ${Math.sin(angle * (Math.PI / 180)) * 50}%)`; // Corrected Y coordinate

                return (
                    <div 
                        key={index} 
                        className={styles.opponent} 
                        style={{ top: x, left: y }}
                    >
                        <UserController isUser = {false} userName={opponent.name} userIcon={opponent.icon} numDice={opponent.numDice}/>
                    </div>
                );
            })}
        </div>
    );
};

export default GameTable;
