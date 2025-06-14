import DiceRoller from "../DiceRoll/DiceRoll";
import { useGameState } from "../../store/gameStore";
import { useState } from "react";
import Button from "../Button/Button";
import styles from "./RollModal.module.css";

const RollModal : React.FC = () => {
    const player = useGameState((state) => state.player);
    const [rolling, setRolling] = useState(false);
    return (
        <div className={styles.container}>
            <button className={styles.closeButton} onClick={() => console.log("Close modal")}>
                &times;
            </button>
            <div>
                {
                    <DiceRoller numDice={6} diceValues={[]} rolling={rolling}/>
                }
            </div>
            <Button
                text="Roll Dice"
                onClick={() => {
                    setRolling(true);
                    setTimeout(() => {
                        // rollDice function

                        setRolling(false);
                        
                    }, 2000);
                }}
            />
        </div>
    );
};

export default RollModal;