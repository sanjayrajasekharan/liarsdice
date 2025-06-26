import React, {useState} from 'react';
import PlayersDisplay from './PlayersDisplay';
import Button from '../Button/Button';
import ClaimStack from '../ClaimStack/ClaimStack';
import DiceRoll from '../DiceRoll/DiceRoll';

const PlayersDisplayMock: React.FC = () => {
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(1);
    const [userPlayerIndex, setUserPlayerIndex] = useState(0);
    
    // Mock multiple claims for testing the stack
    const mockClaims = [
        { value: 2, quantity: 1, userName: "Ben" },
        { value: 3, quantity: 2, userName: "Abdullah" },
        { value: 4, quantity: 3, userName: "April" },
        { value: 5, quantity: 4, userName: "Colin" },
        { value: 6, quantity: 5, userName: "Sanjay" },
    ];

    const [claims, setClaims] = useState(mockClaims);

    const addClaim = () => {
        // Simulate adding a new claim
        const newClaim = {
            value: Math.floor(Math.random() * 6) + 1,
            quantity: Math.floor(Math.random() * 5) + 1,
            userName: `Sanjay`,
        };

        setClaims((prevClaims) => [...prevClaims, newClaim]);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--surface-secondary)',
            padding: 'var(--space-lg) 0',
            boxSizing: 'border-box',
        }}>
            <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', flex: 1 }}>
                <ClaimStack claims={claims} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: 'var(--space-lg) 0' }}>
                    <PlayersDisplay
                        players={{ April: 2, Abdullah: 3, Ben: 1, Colin: 4, Sanjay: 5 }}
                        userPlayerIndex={userPlayerIndex}
                        currentPlayerIndex={currentPlayerIndex}
                    />
                </div>
                <div style={{ margin: 'var(--space-lg) 0' }}>
                    <DiceRoll diceValues={[1,2,3,4,5,6]}/>
                </div>
            </div>
            <div style={{
                width: '100%',
                maxWidth: 480,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-md)',
                position: 'fixed',
                left: 0,
                bottom: 0,
                padding: 'var(--space-lg) var(--space-base)',
                background: 'var(--surface-secondary)',
                boxShadow: '0 -4px 24px 0 rgba(0,0,0,0.08)',
                zIndex: 10,
            }}>
                <div style={{ width: '100%' }}>
                    <Button onClick={() => {addClaim(); setCurrentPlayerIndex((prev) => (prev + 1) % 5)}} text="Make Claim" variant="black" />
                </div>
                <div style={{ width: '100%' }}>
                    <Button onClick={() => setCurrentPlayerIndex((prev) => (prev + 1) % 5)} text="Challenge" variant="red" />
                </div>
            </div>
        </div>
    );
}

export default PlayersDisplayMock;