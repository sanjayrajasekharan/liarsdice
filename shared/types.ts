// Core domain types - shared between client and server
// Type aliases for semantic clarity
export type PlayerId = string;
export type GameCode = string;

export const GameStage = {
  PRE_GAME: 'PRE_GAME',
  ROUND_ROBBIN: 'ROUND_ROBBIN',
  POST_ROUND: 'POST_ROUND',
  POST_GAME: 'POST_GAME',
} as const;

export type GameStage = typeof GameStage[keyof typeof GameStage];