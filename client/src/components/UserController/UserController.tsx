import React, { useState } from "react";
import UserDisplay from "../UserDisplay";
import DiceRoller from "../DiceRoll/DiceRoll";
import Button from "../Button/Button";
import styles from "./UserController.module.css";

interface UserControllerProps {
    userName: string;
    userIcon: string;
    numDice: number;
    isUser: boolean;
    isTurn: boolean;
}

const UserController: React.FC<UserControllerProps> = ({
    userName,
    userIcon,
    numDice,
    isUser,
}) => {
    const [rolling, setRolling] = useState(false);
    //   const [finishedRolling, setFinishedRolling] = useState(false);
    const [diceValues, setDiceValues] = useState<number[]>([]);
    //   const [showDiceRoller, setShowDiceRoller] = useState(false);
    const displaySize = 80;

    // Simulated API call to get dice roll values
    const fetchDiceRoll = async () => {
        setRolling(true);
        // setShowDiceRoller(true); // Show the dice roller when rolling starts

        setTimeout(() => {
            const serverResponse = Array(numDice)
                .fill(0)
                .map(() => Math.floor(Math.random() * 6) + 1); // Simulated server response

            setDiceValues(serverResponse);
            setRolling(false);
            //   setFinishedRolling(false);
        }, 2000); // Simulated API delay (2 seconds)
    };

    return (
        <div className={styles.container}>
            {/* Always reserve space for DiceRoller */}
            <div
                style={{
                    visibility:
                        rolling || diceValues.length > 0 ? "visible" : "hidden",
                }}
                className={styles.diceRollerContainer}
            >
                <DiceRoller
                    numDice={numDice}
                    diceValues={diceValues}
                    rolling={rolling}
                />
            </div>

            {/* User Display */}
            <div className={styles.userDisplayContainer}>
                <div className={styles.iconContainer}>
                    <div className={styles.icon}>{userIcon} </div>
                </div>
            </div>

            <div className={styles.userName}> 
                {userName}
            </div>

            <div className= {styles.buttonContainer} >
                {
                    !isUser || rolling || diceValues.length > 0 ? null :
                <Button
                    onClick={fetchDiceRoll}
                    disabled={rolling || diceValues.length > 0 || !isUser}
                    // hidden={!isUser || rolling || diceValues.length > 0}
                    text={"Roll"}
                />

                // isUser && isTurn 
}
            </div>
        </div>
    );
};

export default UserController;
