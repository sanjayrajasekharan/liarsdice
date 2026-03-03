import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  GameService,
  useGameState,
  selectIsHost,
} from '@services/gameService';
import { GameStage } from 'shared/domain';

import Lobby from '@components/game/stages/Lobby/Lobby';
import Round from '@components/game/stages/Round/Round';
import PostRound from '@components/game/stages/PostRound/PostRound';
import GameOver from '@components/game/stages/GameOver/GameOver';
import LeaveGame from '@components/game/LeaveGame/LeaveGame';
import { diceSvgs } from '@assets/dice';

const Game: React.FC = () => {
  const gameCode = useGameState(state => state.gameCode);
  const gameState = useGameState(state => state.gameState);
  const isConnected = useGameState(state => state.isConnected);
  const isLeaving = useGameState(state => state.isLeaving);
  const error = useGameState(state => state.error);
  const isHost = useGameState(selectIsHost);

  useEffect(() => {
    if (gameCode && !isConnected) {
      GameService.connectSocket();
    }
  }, [gameCode, isConnected]);

  if (isLeaving) return;

  if (!gameState) {
    return (
      <div className="h-dvh flex items-center justify-center p-4">
        <div className="card text-center">
          <p className="text-text-secondary">
            {isLeaving ? 'Leaving game...' : 'Connecting to game...'}
          </p>
        </div>
      </div>
    );
  }


  const renderStage = () => {
    switch (gameState.stage) {
      case GameStage.PRE_GAME:
        return <Lobby key="lobby" isHost={isHost} />;

      case GameStage.ROUND_ROBIN:
        return <Round key="round" />;

      case GameStage.POST_ROUND:
        return <PostRound key="post-round" />;

      case GameStage.POST_GAME:
        return <GameOver key="game-over" />;

      default:
        return <div key="unknown">Unknown game state</div>;
    }
  };

  return (
    <div className="h-dvh flex flex-col bg-surface-primary overflow-x-hidden">
      <header className="shrink-0 flex items-center justify-between px-4 py-3 bg-surface-elevated border-b border-border-light">
        <span className="text-sm flex items-center gap-4 font-medium text-text-secondary">
          <img
            src={diceSvgs[5]}
            alt={`Liar's Dice Logo`}
            className="w-5 h-5 inline-block shrink-0"
          />
          <span className="font-mono text-text-primary">{gameCode}</span>
        </span>
        <div className="flex items-center gap-3">
          <LeaveGame />
          <span className="text-sm flex items-center gap-1.5">
            <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
              <circle cx="4" cy="4" r="4" fill={isConnected ? '#22c55e' : '#ef4444'} />
            </svg>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
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
