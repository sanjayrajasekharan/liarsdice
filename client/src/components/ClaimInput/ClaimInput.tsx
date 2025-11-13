import { useState } from "react";
import { motion } from "framer-motion";
import oneSvg from "../../assets/dice/one.svg?url";
import twoSvg from "../../assets/dice/two.svg?url";
import threeSvg from "../../assets/dice/three.svg?url";
import fourSvg from "../../assets/dice/four.svg?url";
import fiveSvg from "../../assets/dice/five.svg?url";
import sixSvg from "../../assets/dice/six.svg?url";

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
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-1000 "> {/* overlay */}
            <div className="w-full p-4"> {/* container */}
                <div className="flex flex-row items-center justify-center"> {/* diceSelector */}
                    {Object.entries(diceSvgs).map(([value, src]) => (
                        <div
                            key={value}
                            className="m-1 border-2 border-transparent relative flex justify-center items-center w-full rounded-xl
                                       hover:cursor-pointer hover:border-accent"
                            onClick={() => {
                                const newDieValue = Number(value);
                                const newStartCount = newDieValue <= currentDieValue ? currentCount + 1 : currentCount;
                                setDieValue(newDieValue);
                                setCount(newStartCount);
                            }}
                        >
                            <img src={src} alt={`Dice ${value}`} className="block h-8" />
                            {
                                value == String(dieValue) && (
                                    <motion.div
                                        className = "absolute -inset-1 z-1 border border-accent rounded-xl"
                                        layoutId="selected-die"
                                        id="selected-die"
                                        initial={false}
                                    />
                                )
                            }
                        </div>
                    ))}
                </div>
                <div className="m-1 rounded-xl flex flex-row items-stretch justify-between flex-wrap text-xl w-full"> {/* countSelector */}
                    {

                        Array.from({ length: 4 }, (_, i) => i + startCount).map((value) => (
                            <div
                                key={value}
                                className="mx-1 py-2 px-4 border-2 border-transparent relative flex-1 flex justify-center items-center z-1 w-full rounded-xl
                                           hover:cursor-pointer hover:border-accent"
                                onClick={() => {setCount(value)}}
                            >
                                {value}
                                {
                                    value === count && (
                                        <motion.div
                                            className="absolute -inset-1 z-1 border border-accent rounded-xl"
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
