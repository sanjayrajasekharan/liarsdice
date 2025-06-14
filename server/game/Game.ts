import { Player } from './Player';
import { ServerMessage, Claim, PublicGameState } from '../../shared/protocol';
import { ErrorCode } from '../../shared/errorCodes';

export class Game {
  readonly code: string;
  readonly players: Map<string, Player> = new Map();
  hostId: string = '';
  gameStage: string = 'PRE_GAME';
  currentClaim: Claim | null = null;
  turnIndex: number = 0;
  numPlayersRolled: number = 0;

  constructor(code: string) {
    this.code = code;
  }

  addPlayer(playerId: string, name: string, isHost: boolean): ServerMessage | ErrorCode {
    if (this.players.has(playerId)) return ErrorCode.PLAYER_ALREADY_EXISTS;
    if (this.players.size >= 6) return ErrorCode.GAME_FULL;
    if (this.gameStage !== 'PRE_GAME') return ErrorCode.GAME_IN_PROGRESS;

    const player = new Player(playerId, name, this.players.size);
    this.players.set(playerId, player);

    if (isHost) {
      player.isHost = true;
      this.hostId = playerId;
    }

    return {
      type: 'player_joined',
      payload: {
        id: player.publicId,
        name: player.name,
        index: player.index,
      },
    };
  }

  removePlayer(playerId: string): ServerMessage | null {
    const leaving = this.players.get(playerId);
    if (!leaving) return null;

    this.players.delete(playerId);

    for (const p of this.players.values()) {
      if (p.index > leaving.index) p.index -= 1;
    }

    if (this.hostId === playerId && this.players.size > 0) {
      const newHost = [...this.players.values()].find(p => p.index === 0);
      if (newHost) {
        newHost.isHost = true;
        this.hostId = newHost.privateId;
      }
    }

    return {
      type: 'player_left',
      payload: {
        id: leaving.publicId,
        name: leaving.name,
        index: leaving.index,
      },
    };
  }

  getCurrentPlayer(): Player {
    return [...this.players.values()].find(p => p.index === this.turnIndex)!;
  }

  startGame(callerId: string): ServerMessage | ErrorCode {
    if (callerId !== this.hostId) return ErrorCode.UNAUTHORIZED;
    if (this.gameStage !== 'PRE_GAME') return ErrorCode.GAME_IN_PROGRESS;
    if (this.players.size < 2) return ErrorCode.NOT_ENOUGH_PLAYERS;

    this.gameStage = 'START_SELECTION';
    return { type: 'game_started' };
  }

  startRound(callerId: string): ServerMessage | ErrorCode {
    if (callerId !== this.hostId) return ErrorCode.UNAUTHORIZED;
    if (this.gameStage !== 'START_SELECTION') return ErrorCode.ROUND_NOT_ACTIVE;

    this.currentClaim = null;
    this.gameStage = 'DICE_ROLLING';
    this.numPlayersRolled = 0;

    for (const p of this.players.values()) p.resetForRound();

    return { type: 'round_started' };
  }

  rollDice(playerId: string): ServerMessage | ErrorCode {
    const player = this.players.get(playerId);
    if (!player) return ErrorCode.UNAUTHORIZED;
    if (this.gameStage !== 'DICE_ROLLING') return ErrorCode.ROUND_NOT_ACTIVE;
    if (player.hasRolled) return ErrorCode.OUT_OF_TURN;

    player.rollDice();
    this.numPlayersRolled++;

    const msg: ServerMessage = {
      type: 'dice_rolled',
      payload: { rolls: player.dice },
    };

    if (this.numPlayersRolled === this.players.size) {
      this.gameStage = 'ROUND_ROBBIN';
    }

    return msg;
  }

  makeClaim(playerId: string, claim: Claim): ServerMessage | ErrorCode {
    const player = this.players.get(playerId);
    if (!player) return ErrorCode.UNAUTHORIZED;
    if (this.gameStage !== 'ROUND_ROBBIN') return ErrorCode.ROUND_NOT_ACTIVE;
    if (playerId !== this.getCurrentPlayer().privateId) return ErrorCode.OUT_OF_TURN;
    if (!this.isValidClaim(claim)) return ErrorCode.INVALID_CLAIM;

    this.currentClaim = claim;
    this.turnIndex = (this.turnIndex + 1) % this.players.size;

    return { type: 'claim_made', payload: claim };
  }

  challengeClaim(playerId: string): ServerMessage | ErrorCode {
    const player = this.players.get(playerId);
    if (!player) return ErrorCode.UNAUTHORIZED;
    if (this.gameStage !== 'ROUND_ROBBIN') return ErrorCode.ROUND_NOT_ACTIVE;
    if (playerId !== this.getCurrentPlayer().privateId) return ErrorCode.OUT_OF_TURN;
    if (!this.currentClaim) return ErrorCode.INVALID_CHALLENGE;

    const players = [...this.players.values()];
    const challenger = players[this.turnIndex];
    const previous = players[(this.turnIndex - 1 + players.length) % players.length];

    const total = this.countDice(this.currentClaim.value);
    const isLie = total < this.currentClaim.quantity;

    const loser = isLie ? previous : challenger;
    const winner = isLie ? challenger : previous;

    loser.remainingDice--;

    const gameEnded = [...this.players.values()].filter(p => p.remainingDice > 0).length === 1;
    this.gameStage = gameEnded ? 'POST_GAME' : 'POST_ROUND';
    this.currentClaim = null;

    for (const p of this.players.values()) p.resetForRound();

    return {
      type: 'claim_challenged',
      payload: {
        winnerIndex: winner.index,
        loserIndex: loser.index,
        totalDice: total,
        diceRemainingPerPlayer: players.map(p => p.remainingDice),
        gameEnded,
      },
    };
  }

  getPublicGameStateFor(player: Player): PublicGameState {
    return {
      hostId: this.players.get(this.hostId)!.publicId,
      gameStage: this.gameStage,
      currentClaim: this.currentClaim,
      turnIndex: this.turnIndex,
      player: {
        id: player.publicId,
        name: player.name,
        index: player.index,
        isHost: player.privateId === this.hostId,
        remainingDice: player.remainingDice,
        dice: player.dice,
      },
      opponents: [...this.players.values()]
        .filter(p => p.privateId !== player.privateId)
        .map(p => ({
          id: p.publicId,
          name: p.name,
          index: p.index,
          remainingDice: p.remainingDice,
          dice: this.gameStage === 'POST_ROUND' || this.gameStage === 'POST_GAME' ? p.dice : undefined,
        }))
        .sort((a, b) => a.index - b.index),
    };
  }

  private isValidClaim(claim: Claim): boolean {
    if (!this.currentClaim) return true;
    return (
      claim.quantity > this.currentClaim.quantity ||
      (claim.quantity === this.currentClaim.quantity && claim.value > this.currentClaim.value)
    );
  }

  private countDice(value: number): number {
    return [...this.players.values()].reduce((sum, p) => sum + p.dice.filter(d => d === value).length, 0);
  }
}
