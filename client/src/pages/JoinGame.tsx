import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import 'index.css'; // Ensure to import the CSS file
import Button from '../components/Button/Button';
import Card from '../components/Card/Card';

interface JoinGameProps {
    gameCode: string;
    setGameCode: (code: string) => void;
    playerName: string;
    setPlayerName: (name: string) => void;
    playerId: string;
    setPlayerId: (id: string) => void;
}

const JoinGame: React.FC<JoinGameProps> = ({ gameCode, setGameCode, playerName, setPlayerName, playerId, setPlayerId }) => {
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState('');

    function getOrCreatePlayerId() {
        let id = localStorage.getItem("playerId");
        if (!id) {
            id = `player-${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem("playerId", id);
        }
        return id;
    }

    useEffect(() => {
        const id = getOrCreatePlayerId();
        setPlayerId(id);
    }, [setPlayerId]);

    const handleJoinGame = async () => {
        try {
            const response = await fetch('http://localhost:3000/join-game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ gameCode, playerId, playerName }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                setErrorMessage(errorData.error || 'An unknown error occurred');
                setGameCode('');
                console.error('Error joining game:', errorData);
                return; // Exit if there's an error
            }

            setErrorMessage('');
            navigate(`/game/${gameCode}`);
        } catch (error) {
            setErrorMessage('Failed to join game: ' + (error instanceof Error ? error.message : String(error)));
            console.error('Failed to join game:', error);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <div className="container">
                <Card title="JOIN" error={errorMessage}>
                        <input
                            type="text"
                            value={gameCode}
                            onChange={(e) => setGameCode(e.target.value)}
                            placeholder="Enter game code"
                            className="input-field"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleJoinGame(); // Trigger the button press
                                }
                            }}
                        />
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Enter your name"
                            className="input-field"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleJoinGame(); // Trigger the button press
                                }
                            }}
                        />
                        <Button onClick={handleJoinGame} text="Join" variant='red'/>
                        {errorMessage && <p className="error-message">{errorMessage}</p>}
                </Card>
            </div>
        </div>
    );
};

export default JoinGame; 