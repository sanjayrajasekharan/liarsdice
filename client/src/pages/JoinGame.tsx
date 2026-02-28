import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GameService } from '../services/gameService';
import { EntryCard } from '@components/layout';
import { toast } from '@store/toastStore';

const JoinGame: React.FC = () => {
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const location = useLocation();

  useEffect(() => {
    if (location.state?.error) {
      toast.error(location.state.error);
    }
    if (location.state?.gameCode) {
      setGameCode(location.state.gameCode);
    }
  }, [location.state]);

  const handleJoinGame = async () => {
    if (!gameCode.trim()) {
      toast.error('Please enter a game code');
      return;
    }
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    try {
      await GameService.joinGame(gameCode, playerName);
      const storeGameCode = GameService.getGameCode();
      if (storeGameCode) {
        navigate(`/game/${storeGameCode}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join game');
    }
  };

  return (
    <EntryCard title="Join Game">
      <div className="space-y-4">
        <input
          type="text"
          value={gameCode}
          onChange={(e) => setGameCode(e.target.value)}
          placeholder="Enter game code"
          className="input-field"
          onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
        />
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          className="input-field"
          onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
        />
        <div className='flex gap-2'>
          <button
            onClick={handleJoinGame}
            className="btn-primary w-full"
          >
            Create Game
          </button>
          <button onClick={() => navigate('/')} className="btn-ghost w-full">
            Back
          </button>
        </div>
      </div>
    </EntryCard>
  );
};

export default JoinGame;
