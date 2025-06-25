// Core domain types - shared between client and server
export interface Claim {
  quantity: number;
  value: number;
}

export interface Player {
  id: string;
  name: string;
  index: number;
  remainingDice: number;
  dice: number[];
}

export interface PublicPlayer {
  id: string;
  name: string;
  index: number;
  remainingDice: number;
  dice?: number[]; // Only visible in certain game states
}

export interface GameState {
  hostId: string;
  gameStage: GameStage;
  currentClaim: (Claim & { playerId: string }) | null;
  turnIndex: number;
  player: Player & { isHost: boolean };
  opponents: PublicPlayer[];
}

// Game stages and states
export const GameStage = {
  PRE_GAME: 'PRE_GAME',
  ROUND_ROBBIN: 'ROUND_ROBBIN',
  POST_ROUND: 'POST_ROUND',
  POST_GAME: 'POST_GAME',
} as const;

export type GameStage = typeof GameStage[keyof typeof GameStage];

// Error handling
export const ErrorCode = {
  INVALID_CLAIM: 'INVALID_CLAIM',
  INVALID_CHALLENGE: 'INVALID_CHALLENGE',
  GAME_NOT_FOUND: 'GAME_NOT_FOUND',
  ROUND_NOT_ACTIVE: 'ROUND_NOT_ACTIVE',
  OUT_OF_TURN: 'OUT_OF_TURN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  GAME_IN_PROGRESS: 'GAME_IN_PROGRESS',
  NOT_ENOUGH_PLAYERS: 'NOT_ENOUGH_PLAYERS',
  PLAYER_ALREADY_EXISTS: 'PLAYER_ALREADY_EXISTS',
  GAME_FULL: 'GAME_FULL',
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

export const errorMessages: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_CLAIM]: 'Claim must be higher than the previous claim',
  [ErrorCode.INVALID_CHALLENGE]: 'Cannot challenge nonexistent claim',
  [ErrorCode.GAME_NOT_FOUND]: 'Game not found',
  [ErrorCode.ROUND_NOT_ACTIVE]: 'Round not active',
  [ErrorCode.OUT_OF_TURN]: 'Attempting to make a move out of turn',
  [ErrorCode.UNAUTHORIZED]: 'Player not authorized for this action',
  [ErrorCode.GAME_IN_PROGRESS]: 'Game already in progress',
  [ErrorCode.NOT_ENOUGH_PLAYERS]: 'Not enough players to start the game',
  [ErrorCode.PLAYER_ALREADY_EXISTS]: 'Player with this ID already exists in the game',
  [ErrorCode.GAME_FULL]: 'Game is full, cannot add more players',
};

// Result type for domain operations
export type Result<T, E = ErrorCode> = 
  | { ok: true; value: T }
  | { ok: false; error: E };
