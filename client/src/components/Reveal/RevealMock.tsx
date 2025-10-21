import React from 'react';
import Reveal from './Reveal';




const RevealMock: React.FC = () => {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>
            <Reveal
                players={[
                    { name: 'Abdullah', diceCount: 2 },
                    { name: 'Ben', diceCount: 0 },
                    { name: 'April', diceCount: 4 },
                    { name: 'Colin', diceCount: 5 },
                    { name: 'Sanjay', diceCount: 0 }
                ]}
                diceFace={4}
                userPlayerIndex={0}
            />
        </div>
    );
}

export default RevealMock;