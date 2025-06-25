import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/Button/Button';
import Card from '../components/Card/Card';
import { GameService } from '../services/gameService';
import { useGameState } from '../store/gameStore';

const JoinGame: React.FC = () => {
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState('');
    const [gameCode, setGameCode] = useState('');
    const [playerName, setPlayerName] = useState('');
    const location = useLocation();
    
    const { gameCode: storeGameCode } = useGameState();

    useEffect(() => {
        // Check if there's an error in location state
        if (location.state?.error) {
            setErrorMessage(location.state.error);
        }
    }, [location.state]);

    useEffect(() => {
        // Navigate to game when gameCode is set in store
        if (storeGameCode) {
            navigate(`/game/${storeGameCode}`);
        }
    }, [storeGameCode, navigate]);

    const handleJoinGame = async () => {
        try {
            await GameService.joinGame(gameCode, playerName);
            setErrorMessage('');
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
                                    handleJoinGame();
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
                                    handleJoinGame();
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