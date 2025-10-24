import { Action } from './actions';

export type PlayerId = string;
export type GameCode = string;
export type DieFace = 1 | 2 | 3 | 4 | 5 | 6;

export const GameStage = {
  PRE_GAME: 'PRE_GAME',
  ROUND_ROBIN: 'ROUND_ROBBIN',
  POST_ROUND: 'POST_ROUND',
  POST_GAME: 'POST_GAME',
} as const;

export type GameStage = typeof GameStage[keyof typeof GameStage];

export type ClaimMessage = {
  action: Action.CLAIM;
  quantity: number;
  face: DieFace;
};

export type ChallengeMessage = {
  action: Action.CHALLENGE;
};

export type StartGameMessage = {
  action: Action.START_GAME;
};

export type PlayerMessage = ClaimMessage | ChallengeMessage | StartGameMessage;