import { Action } from './actions';
import { StateChange } from './states';

export type PlayerId = string;
export type SocketId = string;
export type GameCode = string;
export type DieFace = 1 | 2 | 3 | 4 | 5 | 6;

export const GameStage = {
  PRE_GAME: 'PRE_GAME',
  ROUND_ROBIN: 'ROUND_ROBBIN',
  POST_ROUND: 'POST_ROUND',
  POST_GAME: 'POST_GAME',
} as const;

export type GameStage = typeof GameStage[keyof typeof GameStage];

export type ChallengeResult = {
  winnerId: PlayerId;
  loserId: PlayerId;
  loserOut: boolean;
};

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

export type StartRoundMessage = {
  action: Action.START_ROUND;
};

export type PlayerMessage = ClaimMessage | ChallengeMessage | StartGameMessage | StartRoundMessage;
  

export type PlayerJoinedMessage = {
    type: StateChange.PLAYER_JOINED;
    playerId: PlayerId;
};

export type PlayerLeftMessage =  {
    type: StateChange.PLAYER_LEFT;
    playerId: PlayerId;
};

export type GameStartedMessage =   {
    type: StateChange.GAME_STARTED;
    startingPlayerId: PlayerId;
};
export type RoundStartedMessage =   {
    type: StateChange.ROUND_STARTED;
    startingPlayerId: PlayerId;
};

export type DiceRolledMessage =   {
    type: StateChange.DICE_ROLLED;
    dice: DieFace[];
};

export type ClaimMadeMessage =  {
    type: StateChange.CLAIM_MADE;
    playerId: PlayerId;
    faceValue: DieFace;
    quantity: number;
}

export type ChallengeMadeMessage =  {
    type: StateChange.CHALLENGE_MADE;
    winnerId: PlayerId;
    loserId: PlayerId;
    loserOut: boolean;
};

export type GameEndedMessage = {
    type: StateChange.GAME_ENDED;
    winnerId: PlayerId;
};

export type ServerMessage = PlayerJoinedMessage | PlayerLeftMessage | GameStartedMessage | RoundStartedMessage | 
                            DiceRolledMessage | ClaimMadeMessage | ChallengeMadeMessage | GameEndedMessage;