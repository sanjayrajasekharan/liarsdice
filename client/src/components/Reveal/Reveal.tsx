import React from 'react';
import { motion } from "framer-motion";
import styles from "./Reveal.module.css";

// import svg images for dice faces

import oneSvg from "../../assets/dice/one.svg?url";
import twoSvg from "../../assets/dice/two.svg?url";
import threeSvg from "../../assets/dice/three.svg?url";
import fourSvg from "../../assets/dice/four.svg?url";
import fiveSvg from "../../assets/dice/five.svg?url";
import sixSvg from "../../assets/dice/six.svg?url";
import egg from "../../assets/egg.svg?url"; // Fallback image for no dice

import { clsx } from 'clsx';


interface Player {
    name: string;
    diceCount: number;
}

interface RevealProps {
    players: Player[];
    diceFace: number;
    userPlayerIndex: number;
}

const diceFaces: Record<number, string> = {
    1: oneSvg,
    2: twoSvg,
    3: threeSvg,
    4: fourSvg,
    5: fiveSvg,
    6: sixSvg
};

// Animation variants
const containerVariants = {
    hidden: { 
        opacity: 0,
        scale: 0.5,
        // y: 50
    },
    show: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.6,
            type: "spring",
            bounce: 0.1,
            delayChildren: 0.8, // wait for table animation to complete
            staggerChildren: 1, // delay between each row
        },
    },
};

const rowVariants = {
    hidden: { opacity: 1 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            staggerChildren: 0.1
        },
    },
};

const footerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            duration: 0.5,
        },
    },
}

const diceContainerVariants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.1, // delay between each die
        },
    },
};

const dieVariants = {
    hidden: { opacity: 0, scale: 0, x: 10 },
    show: { 
        opacity: 1, 
        scale: 1, 
        x: 0,
        transition: {
            duration: 0.5
        },
    },
};

const Reveal: React.FC<RevealProps> = ({ players, diceFace, userPlayerIndex }) => {
    return (
        <motion.div 
            className={styles.table}
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            {
                players.map((player, index) => (
                    <motion.div 
                        className={
                            clsx(styles.row, {[styles.oddRow]: index % 2 !== 0})} 
                        key={index}
                        variants={rowVariants}
                    >
                        <h3 className={styles.playerName}>
                            {player.name} {index === userPlayerIndex && "(You)"}
                        </h3>
                        <motion.div 
                            className={styles.diceContainer}
                            variants={diceContainerVariants}
                        >
                        {
                            player.diceCount > 0 ?
                            Array.from({ length: player.diceCount }, (_, i) => (
                                <motion.img
                                    key={i}
                                    className={styles.dieImage}
                                    src={diceFaces[diceFace]}
                                    alt={`Die showing ${diceFace}`}
                                    variants={dieVariants}
                                />
                            )) :
                            <motion.img
                                className={styles.eggImage}
                                src={egg}
                                alt="No dice"
                                variants ={dieVariants} // Use the same animation for fallback image
                            />
                        }
                        </motion.div>
                    </motion.div>
                ))
            }

            <div className={clsx(styles.footer, styles.row)}>
                <motion.div variants={footerVariants} className={styles.footerContent}>
                <h3>Total {diceFace}s</h3>
                <h3 
                    className={clsx(styles.totalDiceCount)}
                >
                    {players.reduce((total, player) => total + player.diceCount, 0)}
                </h3>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Reveal;