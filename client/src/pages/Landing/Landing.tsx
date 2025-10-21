import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button/Button';
import styles from './Landing.module.css';
import { useGameState } from '../../store/gameStore';

const LandingPage: React.FC = () => {
    const [titleEmoji, setTitleEmoji] = useState('🎲');
    const [isSpinning, setIsSpinning] = useState(false);
    const error = useGameState((state) => state.error);

    const triggerSpin = (newEmoji: string) => {
        if (isSpinning) return; // Prevent multiple animations
        
        setIsSpinning(true);
        setTimeout(() => {
            setTitleEmoji(newEmoji);
            setTimeout(() => setIsSpinning(false), 500); // Match animation duration
        }, 250); // Half way through the spin
    };

    const handleMouseEnter = () => {
        triggerSpin('😈');
    };

    const handleMouseLeave = () => {
        triggerSpin('🎲');
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
            <div className={styles.form_group}>
                <h1 className={styles.title}>
                    <em>LIAR'S DICE</em>&nbsp;&nbsp;
                    <span className={`${styles.titleEmoji} ${isSpinning ? styles.spin : ''}`}>
                        {titleEmoji}
                    </span>
                </h1>
                <div className={styles.button_container}>
                    <Link to="/create">
                        <Button onMouseEnter={handleMouseEnter} onMouseLeave= {handleMouseLeave} text="New Game" variant='red'/>
                    </Link>
                    <Link to="/join">
                        <Button onMouseEnter={handleMouseEnter} onMouseLeave= {handleMouseLeave} text="Join Game" variant='black'/>
                    </Link>
                    <Link to="/mock">
                        I<Button onMouseEnter={handleMouseEnter} onMouseLeave= {handleMouseLeave} text="🧪 Test New UI" variant='black'/>
                    </Link>
                </div>
                <div className={styles.error_message}>{error || " "}</div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;