export class ClientMessage {
  userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }
}

export class StartGameMessage extends ClientMessage {
  type = 'start_game';
  players: PublicPlayer[];

  constructor(userId: string, players: PublicPlayer[]) {
    super(userId);
    this.players = players;
  }
}

export class StartRoundMessage extends ClientMessage {
  type = 'start_round';

  constructor(userId: string, startingPlayer: PublicPlayer) {
    super(userId);
  }
}

export class RollDiceMessage extends ClientMessage {
  type = 'roll_dice';
}

export class MakeClaimMessage extends ClientMessage {
  type = 'make_claim';
  claim: Claim  

  constructor(userId: string, claim: Claim) {
    super(userId);
    this.claim = claim;
  }
}

export class ChallengeClaimMessage extends ClientMessage {
  type = 'challenge_claim';
}

export class GameStartedMessage {
  type = 'game_started';
}

export class RoundStartedMessage {
  type = 'round_started';
  startingPlayer: PublicPlayer;

  constructor(startingPlayer: PublicPlayer) {
    this.startingPlayer = startingPlayer;
  }
}

export class DiceRollStartedMessage {
  type = 'dice_roll_started';
  roll?: number;

  constructor(roll?: number) {
    this.roll = roll;
  }
}

export class DiceRolledMessage {
  type = 'dice_rolled';
  rolls: number[];

  constructor(rolls: number[]) {
    this.rolls = rolls;
  }
}

export class ClaimMadeMessage {
  type = 'claim_made';
  quantity: number;
  value: number;
  playerId: string;

  constructor(quantity: number, value: number, playerId: string) {
    this.quantity = quantity;
    this.value = value;
    this.playerId = playerId;
  }
}

export class ClaimChallengedMessage {
  type = 'claim_challenged';
  winnerIndex: number;
  loserIndex: number;
  totalDice: number;
  diceRemainingPerPlayer: number[];
  gameEnded: boolean;

  constructor(
    winnerIndex: number,
    loserIndex: number,
    totalDice: number,
    diceRemainingPerPlayer: number[],
    gameEnded: boolean
  ) {
    this.winnerIndex = winnerIndex;
    this.loserIndex = loserIndex;
    this.totalDice = totalDice;
    this.diceRemainingPerPlayer = diceRemainingPerPlayer;
    this.gameEnded = gameEnded;
  }
}

export class PlayerJoinedMessage {
  type = 'player_joined';
  id: string;
  name: string;
  index: number;

  constructor(id: string, name: string, index: number) {
    this.id = id;
    this.name = name;
    this.index = index;
  }
}

export class PlayerLeftMessage {
  type = 'player_left';
  id: string;
  name: string;
  index: number;

  constructor(id: string, name: string, index: number) {
    this.id = id;
    this.name = name;
    this.index = index;
  }
}

export class GameStateMessage {
  type = 'game_state';
  hostId: string;
  gameStage: string;
  currentClaim: ClaimMadeMessage | null;
  turnIndex: number;

  player: {
    id: string;
    name: string;
    index: number;
    isHost: boolean;
    remainingDice: number;
    dice: number[];
  };

  opponents: {
    id: string;
    name: string;
    index: number;
    remainingDice: number;
    dice?: number[];
  }[];

  constructor(
    hostId: string,
    gameStage: string,
    currentClaim: ClaimMadeMessage | null,
    turnIndex: number,
    player: {
      id: string;
      name: string;
      index: number;
      isHost: boolean;
      remainingDice: number;
      dice: number[];
    },
    opponents: {
      id: string;
      name: string;
      index: number;
      remainingDice: number;
      dice?: number[];
    }[]
  ) {
    this.hostId = hostId;
    this.gameStage = gameStage;
    this.currentClaim = currentClaim;
    this.turnIndex = turnIndex;
    this.player = player;
    this.opponents = opponents;
  }
}

export class ErrorMessage {
  type = 'error';
  code: number;
  message: string;

  constructor(code: number, message: string) {
    this.code = code;
    this.message = message;
  }
}

export type ServerMessage =
  | GameStartedMessage
  | RoundStartedMessage
  | DiceRollStartedMessage
  | DiceRolledMessage
  | ClaimMadeMessage
  | ClaimChallengedMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | GameStateMessage
  | ErrorMessage;

export interface Claim {
  quantity: number;
  value: number;
  playerId: string;
}

interface ErrorPayload {
  code: number;
  message: string;
}

export interface PublicPlayer {
  id: string;
  name: string;
  index: number;
}

export interface ChallengeResult {
  winnerIndex: number;
  loserIndex: number;
  totalDice: number;
  diceRemainingPerPlayer: number[];
  gameEnded: boolean;
}

export interface PublicGameState {
  hostId: string;
  gameStage: string;
  currentClaim: Claim | null;
  turnIndex: number;

  player: {
    id: string;
    name: string;
    index: number;
    isHost: boolean;
    remainingDice: number;
    dice: number[];
  };

  opponents: {
    id: string;
    name: string;
    index: number;
    remainingDice: number;
    dice?: number[];
  }[];
}
