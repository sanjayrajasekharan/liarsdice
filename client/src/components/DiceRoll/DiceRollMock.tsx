import React, { useState } from 'react';
import DiceRoll from '../DiceRoll/DiceRoll';
import Button from '../Button/Button';

const DiceRollMock: React.FC = () => {
    const [diceValues, setDiceValues] = useState([1, 2, 3, 4, 5]);
    const [isRolling, setIsRolling] = useState(false);

    const handleRoll = () => {
        setIsRolling(true);
        
        // Generate new random dice values after a delay
        setTimeout(() => {
            const newValues = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);
            setDiceValues(newValues);
            setIsRolling(false);
        }, 1500);
    };

    const handleRollComplete = () => {
        console.log('Roll animation complete');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'var(--surface-secondary)',
            padding: 'var(--space-lg)',
            gap: 'var(--space-xl)',
        }}>
            <h1 style={{ 
                fontSize: 'var(--text-3xl)', 
                fontWeight: 'var(--font-bold)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-lg)'
            }}>
                Dice Roll Mock
            </h1>
            
            <DiceRoll 
                diceValues={diceValues}
                isRolling={isRolling}
                onRollComplete={handleRollComplete}
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', alignItems: 'center' }}>
                <Button 
                    onClick={handleRoll} 
                    text={isRolling ? "Rolling..." : "🎲 Roll Dice"} 
                    variant="red"
                    disabled={isRolling}
                />
                
                <div style={{ 
                    textAlign: 'center', 
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)'
                }}>
                    Current values: {diceValues.join(', ')}
                </div>
            </div>
        </div>
    );
};

export default DiceRollMock;
