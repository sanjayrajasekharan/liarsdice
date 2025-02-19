import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameService } from '../services/gameService';
import  Button from '../components/Button/Button';
import Card from '../components/Card/Card';
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

const CreateGame: React.FC<CreateGameProps> = ({ gameCode, setGameCode, playerName, setPlayerName, playerId, setPlayerId, isHost, setIsHost }) => {
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState(''); // State for error message

    // Function to get or create playerId
    // Set playerId when the component mounts
    useEffect(() => {
        const id = GameService.getOrCreatePlayerId();
        setPlayerId(id);
    }, []);

    const handleCreateGame = async () => {
        try {
            const response = await fetch('http://localhost:3000/create-game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ hostId: playerId, hostName: playerName }), // Include playerId in the request
            });

            const { gameCode } = await response.json();
            setGameCode(gameCode); // Update gameCode state
            setIsHost(true);
            navigate(`/game/${gameCode}`);
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
                    />
                    <Button onClick={handleCreateGame} text="Create" variant='red'/>
            </Card>
        </div>
    );
};

export default CreateGame; 