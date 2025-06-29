import { useState } from "react";
import styles from "./ClaimInput.module.css";
import Button from "../Button/Button";
import upArrow from "../../assets/up.svg";
import downArrow from "../../assets/down.svg";
import xIcon from "../../assets/x.svg";
import { motion } from "framer-motion";
import { useGameState } from "../../store/gameStore";
import oneSvg from '../../assets/dice/one.svg?url';
import twoSvg from '../../assets/dice/two.svg?url';
import threeSvg from '../../assets/dice/three.svg?url';
import fourSvg from '../../assets/dice/four.svg?url';
import fiveSvg from '../../assets/dice/five.svg?url';
import sixSvg from '../../assets/dice/six.svg?url';

type ClaimInputProps = {
    currentDieValue: number;
    currentCount: number;
    open: boolean;
    onClose: () => void;
    onSubmit: (diceValue: number, count: number) => void;
};

const diceSvgs: Record<number, string> = {
    1: oneSvg,
    2: twoSvg,
    3: threeSvg,
    4: fourSvg,
    5: fiveSvg,
    6: sixSvg,
};

const ClaimInput: React.FC<ClaimInputProps> = ({ open, currentDieValue, currentCount, onClose, onSubmit }) => {
    const [diceValue, setDiceValue] = useState(currentDieValue);
    const [count, setCount] = useState(currentCount + 1);
    const [error, setError] = useState("");

    const enum updateAction {
        incrementDie,
        decrementDie,
        incrementCount,
        decrementCount,
    }

    const updateClaim = (action: updateAction) => {

        switch (action) {
            case updateAction.incrementDie:
                setDiceValue((diceValue) =>
                    diceValue === 6 ? diceValue : diceValue + 1
                );
                break;
            case updateAction.decrementDie:
                setDiceValue((diceValue) =>
                    diceValue === 1 ? diceValue : diceValue - 1
                );
                if (diceValue < currentDieValue) {
                    setCount(currentCount + 1);
                }
                break;
            case updateAction.incrementCount:
                setCount((count) => count + 1);
                break;
            case updateAction.decrementCount:
                setCount((count) => {
                    if (diceValue <= currentDieValue) {
                        return count > 1 + currentCount ? count - 1 : count;
                    }
                    else {
                        return count > currentCount ? count - 1 : count;
                    }
                });

                break;
        }
    };

    if (!open) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.container}>
                <button className={styles.x_button}>
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M7 17L16.8995 7.10051"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                        <path
                            d="M7 7.00001L16.8995 16.8995"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                </button>
                <div className={styles.form_group}>
                    <h1>
                        <em> CLAIM</em>
                    </h1>
                    <div className={styles.input_row}>
                        {/* dice_input_container */}
                        <div className={styles.input_container}>
                            <input
                                type="number"
                                value={count}
                                onChange={(e) =>
                                    setCount(parseInt(e.target.value))
                                }
                                className={styles.claim_input}
                            />
                            <div className={styles.dice_button_container}>
                                <button
                                    className={styles.dice_button}
                                    onClick={() =>
                                        updateClaim(updateAction.incrementCount)
                                    }
                                >
                                    <img src={upArrow} alt="up" />
                                </button>
                                <button
                                    className={styles.dice_button}
                                    onClick={() =>
                                        updateClaim(updateAction.decrementCount)
                                    }
                                >
                                    <img src={downArrow} alt="down" />
                                </button>
                            </div>{" "}
                            {/* dice_button_container */}
                        </div>{" "}
                        {/* claim_input_container */}
                        <div className={styles.input_container}>
                                <img
                                    src={diceSvgs[diceValue]}
                                    alt={`Dice ${diceValue}`}
                                    className={styles.dice}
                                />
                            <div className={styles.dice_button_container}>
                                <button
                                    className={styles.dice_button}
                                    onClick={() =>
                                        updateClaim(updateAction.incrementDie)
                                    }
                                >
                                    <img src={upArrow} alt="up" />
                                </button>
                                <button
                                    className={styles.dice_button}
                                    onClick={() =>
                                        updateClaim(updateAction.decrementDie)
                                    }
                                >
                                    <img src={downArrow} alt="down" />
                                </button>
                            </div>{" "}
                            {/* dice_button_container */}
                        </div>{" "}
                    </div>{" "}
                    {/* input_row */}
                    <Button
                        text="Claim"
                        onClick={async () => {
                            try {
                                console.log("1");
                                await onSubmit(diceValue, count);
                            } catch (error) {
                                console.log("herrrr");
                                if (error instanceof Error) {
                                    setError(error.message);
                                }
                            }
                        }}
                    />
                    <div className={styles.error_message}>{error || " "}</div>
                </div>{" "}
                {/* form_group */}
            </div>
        </div>
    );
};

export default ClaimInput;
