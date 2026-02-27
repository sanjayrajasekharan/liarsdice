import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { motion } from 'framer-motion';
import PlayersDisplay, { Player } from '../../ui/PlayersDisplay/PlayersDisplay';
import ClaimTimeline from '../../ui/ClaimTimeline/ClaimTimeline';
import DiceRoll from '../../ui/DiceRoll/DiceRoll';
import ClaimInput from '../../ui/ClaimInput/ClaimInput';
import { ClaimHistoryItem } from '../../../services/gameService';
import { DieFace } from 'shared/domain';

// Mock GameRound component for stories (doesn't need real store connection)
interface MockGameRoundProps {
  players: Player[];
  claimHistory: ClaimHistoryItem[];
  currentClaim: {
    playerId: string;
    playerName: string;
    quantity: number;
    faceValue: number;
  } | null;
  myDice: DieFace[];
  isMyTurn: boolean;
  canChallenge: boolean;
  currentPlayerId: string;
  waitingForPlayer?: string;
}

const MockGameRound: React.FC<MockGameRoundProps> = ({
  players,
  claimHistory,
  currentClaim,
  myDice,
  isMyTurn,
  canChallenge,
  currentPlayerId,
  waitingForPlayer,
}) => {
  const [isClaimInputOpen, setIsClaimInputOpen] = React.useState(false);

  return (
    <div className="h-screen flex flex-col bg-surface-primary">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 bg-surface-elevated border-b border-border-light">
        <span className="text-sm font-medium text-text-secondary">
          Game: <span className="font-mono text-text-primary">ABC123</span>
        </span>
        <span className="text-sm">🟢 Connected</span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <motion.div
          className="flex flex-col h-full overflow-hidden p-4 justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Top content - fixed sizes, grouped together */}
          <div className="flex flex-col gap-3">
            {/* Claim Timeline */}
            <ClaimTimeline
              currentClaim={currentClaim}
              claimHistory={claimHistory}
              currentPlayerId={currentPlayerId}
            />

            {/* Players display */}
            <PlayersDisplay
              players={players}
              claimHistory={claimHistory}
            />

            {/* Your dice */}
            <div className="card flex items-center justify-center py-6">
              {myDice.length > 0 ? (
                <DiceRoll dice={myDice} />
              ) : (
                <p className="text-text-tertiary text-center">Rolling dice...</p>
              )}
            </div>
          </div>

          {/* Action area - fixed to bottom, fixed height */}
          <div className="h-12 flex items-center justify-center">
            {isMyTurn ? (
              <div className="flex gap-3 w-full">
                <button
                  className="btn-primary flex-1"
                  onClick={() => setIsClaimInputOpen(true)}
                >
                  Make a Claim
                </button>

                {canChallenge && (
                  <button className="btn-secondary flex-1">
                    Challenge!
                  </button>
                )}
              </div>
            ) : (
              <p className="text-text-secondary text-sm">
                Waiting for {waitingForPlayer ?? 'opponent'}...
              </p>
            )}
          </div>
        </motion.div>

        {/* Claim Input Modal */}
        <ClaimInput
          isOpen={isClaimInputOpen}
          currentDieValue={currentClaim?.faceValue ?? 1}
          currentCount={currentClaim?.quantity ?? 0}
          onClose={() => setIsClaimInputOpen(false)}
          onSubmit={() => setIsClaimInputOpen(false)}
        />
      </main>
    </div>
  );
};

const meta = {
  title: 'Pages/GameRound',
  component: MockGameRound,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockGameRound>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

export const GameStart: Story = {
  name: 'Game Start - No Claims',
  args: {
    players: [
      { id: '1', name: 'You', diceCount: 5, isCurrentTurn: true, isUser: true },
      { id: '2', name: 'Alice', diceCount: 5, isCurrentTurn: false, isUser: false },
      { id: '3', name: 'Bob', diceCount: 5, isCurrentTurn: false, isUser: false },
    ],
    claimHistory: [],
    currentClaim: null,
    myDice: [2, 3, 4, 5, 6] as DieFace[],
    isMyTurn: true,
    canChallenge: false,
    currentPlayerId: '1',
  },
};

export const YourTurnWithHistory: Story = {
  name: 'Your Turn - With Claim History',
  args: {
    players: [
      { id: '1', name: 'You', diceCount: 5, isCurrentTurn: true, isUser: true },
      { id: '2', name: 'Alice', diceCount: 5, isCurrentTurn: false, isUser: false },
      { id: '3', name: 'Bob', diceCount: 5, isCurrentTurn: false, isUser: false },
    ],
    claimHistory: [
      { claimNumber: 1, playerId: '2', playerName: 'Alice', quantity: 2, faceValue: 3 },
      { claimNumber: 2, playerId: '3', playerName: 'Bob', quantity: 3, faceValue: 3 },
      { claimNumber: 3, playerId: '1', playerName: 'You', quantity: 4, faceValue: 3 },
      { claimNumber: 4, playerId: '2', playerName: 'Alice', quantity: 4, faceValue: 5 },
      { claimNumber: 5, playerId: '3', playerName: 'Bob', quantity: 5, faceValue: 5 },
    ],
    currentClaim: {
      playerId: '3',
      playerName: 'Bob',
      quantity: 5,
      faceValue: 5,
    },
    myDice: [1, 3, 5, 5, 6] as DieFace[],
    isMyTurn: true,
    canChallenge: true,
    currentPlayerId: '1',
  },
};

export const WaitingForOpponent: Story = {
  name: 'Waiting for Opponent',
  args: {
    players: [
      { id: '1', name: 'You', diceCount: 5, isCurrentTurn: false, isUser: true },
      { id: '2', name: 'Alice', diceCount: 5, isCurrentTurn: true, isUser: false },
      { id: '3', name: 'Bob', diceCount: 5, isCurrentTurn: false, isUser: false },
    ],
    claimHistory: [
      { claimNumber: 1, playerId: '1', playerName: 'You', quantity: 2, faceValue: 4 },
      { claimNumber: 2, playerId: '2', playerName: 'Alice', quantity: 3, faceValue: 4 },
      { claimNumber: 3, playerId: '3', playerName: 'Bob', quantity: 4, faceValue: 4 },
      { claimNumber: 4, playerId: '1', playerName: 'You', quantity: 5, faceValue: 4 },
    ],
    currentClaim: {
      playerId: '1',
      playerName: 'You',
      quantity: 5,
      faceValue: 4,
    },
    myDice: [2, 4, 4, 4, 6] as DieFace[],
    isMyTurn: false,
    canChallenge: false,
    currentPlayerId: '1',
    waitingForPlayer: 'Alice',
  },
};

export const LateGame: Story = {
  name: 'Late Game - Some Players Eliminated',
  args: {
    players: [
      { id: '1', name: 'You', diceCount: 3, isCurrentTurn: false, isUser: true },
      { id: '2', name: 'Alice', diceCount: 0, isCurrentTurn: false, isUser: false },
      { id: '3', name: 'Bob', diceCount: 2, isCurrentTurn: true, isUser: false },
      { id: '4', name: 'Charlie', diceCount: 0, isCurrentTurn: false, isUser: false },
    ],
    claimHistory: [
      { claimNumber: 1, playerId: '3', playerName: 'Bob', quantity: 1, faceValue: 2 },
      { claimNumber: 2, playerId: '1', playerName: 'You', quantity: 2, faceValue: 2 },
      { claimNumber: 3, playerId: '3', playerName: 'Bob', quantity: 3, faceValue: 2 },
    ],
    currentClaim: {
      playerId: '3',
      playerName: 'Bob',
      quantity: 3,
      faceValue: 2,
    },
    myDice: [1, 2, 5] as DieFace[],
    isMyTurn: false,
    canChallenge: false,
    currentPlayerId: '1',
    waitingForPlayer: 'Bob',
  },
};

export const SixPlayers: Story = {
  name: 'Full Game - 6 Players',
  args: {
    players: [
      { id: '1', name: 'You', diceCount: 5, isCurrentTurn: false, isUser: true },
      { id: '2', name: 'Alice', diceCount: 5, isCurrentTurn: false, isUser: false },
      { id: '3', name: 'Bob', diceCount: 5, isCurrentTurn: true, isUser: false },
      { id: '4', name: 'Charlie', diceCount: 5, isCurrentTurn: false, isUser: false },
      { id: '5', name: 'Diana', diceCount: 5, isCurrentTurn: false, isUser: false },
      { id: '6', name: 'Edward', diceCount: 5, isCurrentTurn: false, isUser: false },
    ],
    claimHistory: [
      { claimNumber: 1, playerId: '1', playerName: 'You', quantity: 3, faceValue: 2 },
      { claimNumber: 2, playerId: '2', playerName: 'Alice', quantity: 4, faceValue: 2 },
      { claimNumber: 3, playerId: '3', playerName: 'Bob', quantity: 5, faceValue: 2 },
    ],
    currentClaim: {
      playerId: '3',
      playerName: 'Bob',
      quantity: 5,
      faceValue: 2,
    },
    myDice: [1, 2, 2, 4, 6] as DieFace[],
    isMyTurn: false,
    canChallenge: false,
    currentPlayerId: '1',
    waitingForPlayer: 'Bob',
  },
};

export const LongClaimHistory: Story = {
  args: {
    players: [
      { id: '1', name: 'You', diceCount: 4, isCurrentTurn: true, isUser: true },
      { id: '2', name: 'Alice', diceCount: 4, isCurrentTurn: false, isUser: false },
      { id: '3', name: 'Bob', diceCount: 3, isCurrentTurn: false, isUser: false },
    ],
    claimHistory: [
      { claimNumber: 1, playerId: '2', playerName: 'Alice', quantity: 1, faceValue: 1 },
      { claimNumber: 2, playerId: '3', playerName: 'Bob', quantity: 2, faceValue: 1 },
      { claimNumber: 3, playerId: '1', playerName: 'You', quantity: 2, faceValue: 2 },
      { claimNumber: 4, playerId: '2', playerName: 'Alice', quantity: 3, faceValue: 2 },
      { claimNumber: 5, playerId: '3', playerName: 'Bob', quantity: 3, faceValue: 3 },
      { claimNumber: 6, playerId: '1', playerName: 'You', quantity: 4, faceValue: 3 },
      { claimNumber: 7, playerId: '2', playerName: 'Alice', quantity: 5, faceValue: 3 },
      { claimNumber: 8, playerId: '3', playerName: 'Bob', quantity: 5, faceValue: 4 },
      { claimNumber: 9, playerId: '1', playerName: 'You', quantity: 6, faceValue: 4 },
      { claimNumber: 10, playerId: '2', playerName: 'Alice', quantity: 7, faceValue: 4 },
      { claimNumber: 11, playerId: '3', playerName: 'Bob', quantity: 8, faceValue: 4 },
      { claimNumber: 12, playerId: '1', playerName: 'You', quantity: 8, faceValue: 5 },
    ],
    currentClaim: {
      playerId: '1',
      playerName: 'You',
      quantity: 8,
      faceValue: 5,
    },
    myDice: [2, 3, 5, 5] as DieFace[],
    isMyTurn: true,
    canChallenge: true,
    currentPlayerId: '1',
  },
};

export const HeadsUp: Story = {
  name: 'Heads Up - 2 Players',
  args: {
    players: [
      { id: '1', name: 'You', diceCount: 2, isCurrentTurn: true, isUser: true },
      { id: '2', name: 'Alice', diceCount: 1, isCurrentTurn: false, isUser: false },
    ],
    claimHistory: [
      { claimNumber: 1, playerId: '2', playerName: 'Alice', quantity: 1, faceValue: 6 },
      { claimNumber: 2, playerId: '1', playerName: 'You', quantity: 2, faceValue: 6 },
      { claimNumber: 3, playerId: '2', playerName: 'Alice', quantity: 3, faceValue: 6 },
    ],
    currentClaim: {
      playerId: '2',
      playerName: 'Alice',
      quantity: 3,
      faceValue: 6,
    },
    myDice: [3, 6] as DieFace[],
    isMyTurn: true,
    canChallenge: true,
    currentPlayerId: '1',
  },
};

export const LongPlayerNames: Story = {
  args: {
    players: [
      { id: '1', name: 'You', diceCount: 5, isCurrentTurn: true, isUser: true },
      { id: '2', name: 'Alexander Hamilton', diceCount: 5, isCurrentTurn: false, isUser: false },
      { id: '3', name: 'Benjamin Franklin', diceCount: 5, isCurrentTurn: false, isUser: false },
      { id: '4', name: 'Christopher Columbus', diceCount: 5, isCurrentTurn: false, isUser: false },
    ],
    claimHistory: [
      { claimNumber: 1, playerId: '2', playerName: 'Alexander Hamilton', quantity: 2, faceValue: 3 },
      { claimNumber: 2, playerId: '3', playerName: 'Benjamin Franklin', quantity: 3, faceValue: 3 },
      { claimNumber: 3, playerId: '4', playerName: 'Christopher Columbus', quantity: 4, faceValue: 3 },
    ],
    currentClaim: {
      playerId: '4',
      playerName: 'Christopher Columbus',
      quantity: 4,
      faceValue: 3,
    },
    myDice: [1, 3, 3, 4, 5] as DieFace[],
    isMyTurn: true,
    canChallenge: true,
    currentPlayerId: '1',
  },
};
