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

const ClaimInput: React.FC<ClaimInputProps> = ({ currentDieValue, currentCount, onClose, onSubmit }) => {
    const [dieValue, setDieValue] = useState(currentDieValue);
    const [count, setCount] = useState(currentCount + 1);


    const startCount = dieValue <= currentDieValue ? currentCount + 1 : currentCount;

    return (
        <div className={styles.overlay}>
            <div className={styles.container}>
                <div className={styles.diceSelector}>
                    {Object.entries(diceSvgs).map(([value, src]) => (
                        <div
                            key={value}
                            className={styles.die}
                            onClick={() => {
                                const newDieValue = Number(value);
                                const newStartCount = newDieValue <= currentDieValue ? currentCount + 1 : currentCount;
                                setDieValue(newDieValue);
                                setCount(newStartCount);
                            }}
                        >
                            <img src={src} alt={`Dice ${value}`} />
                            {
                                value == String(dieValue) && (
                                    <motion.div
                                        className={styles.selectedDie}
                                        layoutId="selected-die"
                                        id="selected-die"
                                        initial={false}
                                    />
                                )
                            }
                        </div>
                    ))}
                </div>
                <div className={styles.countSelector}>
                    {

                        Array.from({ length: 4 }, (_, i) => i + startCount).map((value) => (
                            <div
                                key={value}
                                className={styles.count}
                                onClick={() => {setCount(value)}}
                            >
                                {value}
                                {
                                    value === count && (
                                        <motion.div
                                            className={styles.selectedCount}
                                            layoutId={`selected-count-${dieValue}`}
                                            key={`selected-count-${dieValue}`}
                                            initial={{ opacity: 0 }}
                                            animate={{opacity: 1 }}
                                        />
                                    )
                                }
                            </div>
                        ))
                    }

                   {/* <div className={styles.otherInput}><i>Other</i></div> */}
                </div>
            </div>
        </div>
    );
};

export default ClaimInput;
