import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameService } from '../services/gameService';
import { EntryCard } from '@components/layout';
import { toast } from '@store/toastStore';

const CreateGame: React.FC = () => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    try {
      await GameService.createGame(playerName);
      const gameCode = GameService.getGameCode();
      if (gameCode) {
        navigate(`/game/${gameCode}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create game');
    }
  };

  return (
    <EntryCard title='Create Game'>
      <div className="space-y-4">
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          className="input-field"
          onKeyDown={(e) => e.key === 'Enter' && handleCreateGame()}
        />
        <button
          onClick={handleCreateGame}
          className="btn-primary w-full"
        >
          Create Game
        </button>
      </div>
    </EntryCard>
  );
};

export default CreateGame;
