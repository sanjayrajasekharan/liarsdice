import { Claim, GameState, GameStage, PublicPlayer, ErrorCode } from './types.js';

// Client-to-Server Messages (Actions)
export type ClientMessage =
  | { type: 'START_GAME' }
  | { type: 'START_ROUND' }
  | { type: 'CLAIM'; claim: Claim }
  | { type: 'CHALLENGE' };

// Server-to-Client Messages (Events)
export type ServerMessage =
  | { type: 'PLAYER_JOINED'; player: PublicPlayer }
  | { type: 'PLAYER_LEFT'; player: PublicPlayer; newPositions: { playerId: string; position: number }[] }
  | { type: 'GAME_STARTED' }
  | { type: 'ROUND_STARTED'; startingPlayer: PublicPlayer; dice: number[] }
  | { type: 'CLAIM_RESULT'; claim: Claim & { playerId: string }; nextTurnPlayerId: string; nextTurnPosition: number }
  | { type: 'PLAYER_ELIMINATED'; playerId: string; remainingDice: number; newPositions: { playerId: string; position: number }[] }
  | { type: 'DICE_COUNT_CHANGED'; playerId: string; remainingDice: number }
  | {
    type: 'CHALLENGE_RESULT';
    winnerIndex: number;
    loserIndex: number;
    totalDice: number;
    diceRemainingPerPlayer: number[];
    gameEnded: boolean;
    allDice?: { playerId: string; dice: number[] }[];
    nextTurnPlayerId: string;
    nextTurnPosition: number;
  }
  | { type: 'GAME_STATE'; state: GameState }
  | { type: 'ERROR'; code: ErrorCode; message: string };

// Type guards for message handling
export const isClientMessage = (msg: any): msg is ClientMessage => {
  return msg && typeof msg.type === 'string' &&
    ['START_GAME', 'START_ROUND', 'CLAIM', 'CHALLENGE'].includes(msg.type);
};

export const isServerMessage = (msg: any): msg is ServerMessage => {
  return msg && typeof msg.type === 'string' &&
    ['PLAYER_JOINED', 'PLAYER_LEFT', 'GAME_STARTED', 'ROUND_STARTED',
      'CLAIM_MADE', 'TURN_CHANGED', 'PLAYER_ELIMINATED', 'DICE_COUNT_CHANGED',
      'CHALLENGE_RESULT', 'GAME_STATE', 'ERROR'].includes(msg.type);
};


