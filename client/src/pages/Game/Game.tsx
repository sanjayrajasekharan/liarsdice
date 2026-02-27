import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  GameService,
  useGameState,
  selectIsHost,
} from '../../services/gameService';
import { GameStage } from 'shared/domain';
import { toast } from '@store/toastStore';

// Import game stage components
import GameLobby from '../../components/game/GameLobby/GameLobby';
import GameRound from '../../components/game/GameRound/GameRound';
import GamePostRound from '../../components/game/GamePostRound/GamePostRound';
import GameOver from '../../components/game/GameOver/GameOver';

const Game: React.FC = () => {
  const { gameCode: urlGameCode } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(false);

  const gameCode = useGameState(state => state.gameCode);
  const gameState = useGameState(state => state.gameState);
  const isConnected = useGameState(state => state.isConnected);
  const error = useGameState(state => state.error);
  const isHost = useGameState(selectIsHost);

  // Connect to socket when component mounts
  useEffect(() => {
    // If we have a game code from URL but not in store, validate and redirect to join
    if (urlGameCode && !gameCode) {
      setIsValidating(true);
      GameService.getGameStatus(urlGameCode).then((status) => {
        setIsValidating(false);
        if (status.joinable) {
          navigate('/join', { state: { gameCode: urlGameCode } });
        } else {
          toast.error(status.reason || 'Unable to join game');
          navigate('/');
        }
      });
      return;
    }

    // Verify URL matches store
    if (urlGameCode && gameCode && urlGameCode !== gameCode) {
      navigate(`/game/${gameCode}`);
      return;
    }

    // Connect socket if we have a game code
    if (gameCode && !isConnected) {
      GameService.connectSocket();
    }

    // Cleanup on unmount
    return () => {
      // Don't disconnect here - let the user stay connected
      // GameService.disconnectSocket();
    };
  }, [gameCode, urlGameCode, isConnected, navigate]);

  // Render loading state
  if (isValidating || !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card text-center">
          {error ? (
            <div>
              <h2 className="text-xl font-bold text-error-600 mb-2">Error</h2>
              <p className="text-text-secondary mb-4">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="btn-primary"
              >
                Back to Home
              </button>
            </div>
          ) : (
            <p className="text-text-secondary">
              {isValidating ? 'Checking game...' : 'Connecting to game...'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Render stage component with AnimatePresence for transitions
  const renderStage = () => {
    switch (gameState.stage) {
      case GameStage.PRE_GAME:
        return <GameLobby key="lobby" isHost={isHost} />;

      case GameStage.ROUND_ROBIN:
        return <GameRound key="round" />;

      case GameStage.POST_ROUND:
        return <GamePostRound key="post-round" isHost={isHost} />;

      case GameStage.POST_GAME:
        return <GameOver key="game-over" />;

      default:
        return <div key="unknown">Unknown game state</div>;
    }
  };

  // replace connected / not connected with a better UI element
  return (
    <div className="h-screen flex flex-col bg-surface-primary overflow-x-hidden">
      <header className="shrink-0 flex items-center justify-between px-4 py-3 bg-surface-elevated border-b border-border-light">
        <span className="text-sm font-medium text-text-secondary">
          <span className="font-mono text-text-primary">{gameCode}</span>
        </span>
        <span className="text-sm flex items-center gap-1.5">
          <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
            <circle cx="4" cy="4" r="4" fill={isConnected ? '#22c55e' : '#ef4444'} />
          </svg>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </header>

      {error && (
        <div className="shrink-0 px-4 py-2 bg-error-50 text-error-700 text-sm text-center border-b border-error-100">
          {error}
        </div>
      )}

      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {renderStage()}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Game;
