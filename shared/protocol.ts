import { Claim, GameState, GameStage, PublicPlayer, ErrorCode } from './types';

// Client-to-Server Messages (Actions)
export type ClientMessage = 
  | { type: 'START_GAME' }
  | { type: 'START_ROUND' }
  | { type: 'CLAIM'; claim: Claim }
  | { type: 'CHALLENGE' };

// Server-to-Client Messages (Events)
export type ServerMessage =
  | { type: 'PLAYER_JOINED'; player: PublicPlayer }
  | { type: 'PLAYER_LEFT'; player: PublicPlayer }
  | { type: 'GAME_STARTED' }
  | { type: 'ROUND_STARTED'; startingPlayer: PublicPlayer; dice: number[] }
  | { type: 'CLAIM_MADE'; claim: Claim & { playerId: string } }
  | { type: 'CHALLENGE_RESULT'; 
      winnerIndex: number; 
      loserIndex: number; 
      totalDice: number; 
      diceRemainingPerPlayer: number[]; 
      gameEnded: boolean 
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
     'CLAIM_MADE', 'CHALLENGE_RESULT', 'GAME_STATE', 'ERROR'].includes(msg.type);
};
