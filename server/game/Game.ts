import { Player } from './Player';
import { Claim, GameState, ErrorCode, Result as DomainResult, GameStage } from '../../shared/types';

export type Result<T, E> = { ok: true; value: T } | { ok: false, error: E };

// Domain result types (no protocol types here)
export type GameStartResult = { success: true };
export type RoundStartResult = { success: true };
export type ClaimResult = { claim: Claim };
export type ChallengeResult = {
  winnerIndex: number;
  loserIndex: number;
  totalDice: number;
  diceRemainingPerPlayer: number[];
  gameEnded: boolean;
};

export class Game {
  readonly code: string;
  readonly players: Map<string, Player> = new Map();
  hostId: string = '';
  gameStage: GameStage = GameStage.PRE_GAME;
  currentClaim: (Claim & { playerId: string }) | null = null;
  turnIndex: number = 0;

  constructor(code: string) {
    this.code = code;
  }

  // Domain methods - return pure domain types
  addPlayer(playerId: string, name: string, isHost: boolean): Result<Player, ErrorCode> {
    if (this.players.has(playerId)) return { ok: false, error: ErrorCode.PLAYER_ALREADY_EXISTS };
    if (this.players.size >= 6) return { ok: false, error: ErrorCode.GAME_FULL };
    if (this.gameStage !== 'PRE_GAME') return { ok: false, error: ErrorCode.GAME_IN_PROGRESS };

    const player = new Player(playerId, name, this.players.size);
    this.players.set(playerId, player);

    if (isHost) {
      player.isHost = true;
      this.hostId = playerId;
    }

    return { ok: true, value: player };
  }

  removePlayer(playerId: string): Result<Player, ErrorCode> {
    const leaving = this.players.get(playerId);
    if (!leaving) return { ok: false, error: ErrorCode.GAME_NOT_FOUND };

    this.players.delete(playerId);

    for (const p of this.players.values()) {
      if (p.index > leaving.index) p.index -= 1;
    }

    if (this.hostId === playerId && this.players.size > 0) {
      const newHost = [...this.players.values()].find(p => p.index === 0);
      if (newHost) {
        newHost.isHost = true;
        this.hostId = newHost.playerId;
      }
    }

    return { ok: true, value: leaving };
  }

  getCurrentPlayer(): Player {
    return [...this.players.values()].find(p => p.index === this.turnIndex)!;
  }

  startGame(callerId: string): Result<GameStartResult, ErrorCode> {
    if (callerId !== this.hostId) return { ok: false, error: ErrorCode.UNAUTHORIZED };
    if (this.gameStage !== GameStage.PRE_GAME) return { ok: false, error: ErrorCode.GAME_IN_PROGRESS };
    if (this.players.size < 2) return { ok: false, error: ErrorCode.NOT_ENOUGH_PLAYERS };

    // Randomly select the starting player
    this.turnIndex = Math.floor(Math.random() * this.players.size);
    
    // Start the first round immediately - roll dice for all players
    this.currentClaim = null;
    this.gameStage = GameStage.ROUND_ROBBIN; // Skip DICE_ROLLING stage

    // Roll dice for all players at round start
    for (const p of this.players.values()) {
      p.resetForRound();
      p.rollDice(); // Pre-roll dice for everyone
    }

    return { ok: true, value: { success: true } };
  }

  makeClaim(playerId: string, claim: Claim): Result<ClaimResult, ErrorCode> {
    const player = this.players.get(playerId);
    if (!player) return { ok: false, error: ErrorCode.UNAUTHORIZED };
    if (this.gameStage !== GameStage.ROUND_ROBBIN) return { ok: false, error: ErrorCode.ROUND_NOT_ACTIVE };
    if (playerId !== this.getCurrentPlayer().playerId) return { ok: false, error: ErrorCode.OUT_OF_TURN };
    if (!this.isValidClaim(claim)) return { ok: false, error: ErrorCode.INVALID_CLAIM };

    this.currentClaim = { ...claim, playerId };
    this.turnIndex = (this.turnIndex + 1) % this.players.size;

    return { ok: true, value: { claim } };
  }

  challengeClaim(playerId: string): Result<ChallengeResult, ErrorCode> {
    const player = this.players.get(playerId);
    if (!player) return { ok: false, error: ErrorCode.UNAUTHORIZED };
    if (this.gameStage !== GameStage.ROUND_ROBBIN) return { ok: false, error: ErrorCode.ROUND_NOT_ACTIVE };
    if (playerId !== this.getCurrentPlayer().playerId) return { ok: false, error: ErrorCode.OUT_OF_TURN };
    if (!this.currentClaim) return { ok: false, error: ErrorCode.INVALID_CHALLENGE };

    const players = [...this.players.values()];
    const challenger = players[this.turnIndex];
    const previous = players[(this.turnIndex - 1 + players.length) % players.length];

    const total = this.countDice(this.currentClaim.value);
    const isLie = total < this.currentClaim.quantity;

    const loser = isLie ? previous : challenger;
    const winner = isLie ? challenger : previous;

    loser.remainingDice--;

    const gameEnded = [...this.players.values()].filter(p => p.remainingDice > 0).length === 1;
    this.gameStage = gameEnded ? GameStage.POST_GAME : GameStage.POST_ROUND;
    this.currentClaim = null;

    // Set the winner as the starting player for the next round
    if (!gameEnded) {
      this.turnIndex = winner.index;
    }

    for (const p of this.players.values()) p.resetForRound();

    return {
      ok: true,
      value: {
        winnerIndex: winner.index,
        loserIndex: loser.index,
        totalDice: total,
        diceRemainingPerPlayer: players.map(p => p.remainingDice),
        gameEnded,
      },
    };
  }

  startNextRound(): Result<RoundStartResult, ErrorCode> {
    if (this.gameStage !== GameStage.POST_ROUND) return { ok: false, error: ErrorCode.ROUND_NOT_ACTIVE };

    this.currentClaim = null;
    this.gameStage = GameStage.ROUND_ROBBIN; // Skip DICE_ROLLING stage

    // Roll dice for all players at round start
    for (const p of this.players.values()) {
      p.resetForRound();
      p.rollDice(); // Pre-roll dice for everyone
    }

    return { ok: true, value: { success: true } };
  }

  hasPlayer(playerId: string): boolean {
    return this.players.has(playerId);
  }

  isEmpty(): boolean {
    return this.players.size === 0;
  }

  getPublicGameStateFor(player: Player): GameState {
    return {
      hostId: this.players.get(this.hostId)!.playerId,
      gameStage: this.gameStage,
      currentClaim: this.currentClaim,
      turnIndex: this.turnIndex,
      player: {
        id: player.playerId,
        name: player.name,
        index: player.index,
        isHost: player.playerId === this.hostId,
        remainingDice: player.remainingDice,
        dice: player.dice,
      },
      opponents: [...this.players.values()]
        .filter(p => p.playerId !== player.playerId)
        .map(p => ({
          id: p.playerId,
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
