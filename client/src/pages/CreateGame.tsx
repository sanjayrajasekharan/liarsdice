import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameService } from '../services/gameService';
import  Button from '../components/Button/Button';
import Card from '../components/Card/Card';
import { useGameState } from '../store/gameStore';

const CreateGame: React.FC = () => {
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState('');
    const [playerName, setPlayerName] = useState('');

    const { gameCode } = useGameState();

    useEffect(() => {
        if (gameCode) {
            navigate(`/game/${gameCode}`);
        }
    }, [gameCode, navigate]);

    const handleCreateGame = async () => {
        try {
            await GameService.createGame(playerName);
        } catch (error) {
            setErrorMessage('Failed to create game: ' + error);
            console.error('Failed to create game:', error);
        }
    };

    return (
        <div className="container">
            <Card title="NEW GAME" error={errorMessage}>
                {/* <h1><em>NEW GAME</em></h1> */}
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Enter your name"
                        className="input-field"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateGame()}
                    />
                    <Button onClick={handleCreateGame} text="Create" variant='red'/>
            </Card>
        </div>
    );
};

export default CreateGame; 