import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameService } from '../services/gameService';
import  Button from '../components/Button/Button';
import Card from '../components/Card/Card';
import { useGameState } from '../store/gameStore';
interface CreateGameProps {
    gameCode: string;
    setGameCode: (code: string) => void;
    playerName: string;
    setPlayerName: (name: string) => void;
    playerId: string;
    setPlayerId: (id: string) => void;
    isHost : boolean;
    setIsHost: (isHost: boolean) => void;
}

const CreateGame: React.FC<CreateGameProps> = ({playerName, setPlayerName, playerId, setPlayerId, isHost, setIsHost }) => {
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState(''); // State for error message

    const {gameCode} = useGameState();


    // Function to get or create playerId
    // Set playerId when the component mounts
    useEffect(() => {
        if (gameCode) {
            navigate(`/game/${gameCode}`);
        }
    }, [gameCode]);

    const handleCreateGame = async () => {
        try {
            GameService.createGame(playerName); // Call createGame function from GameService
        } catch (error) {
            setErrorMessage('Failed to create game: ' + error); // Set error message on catch
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