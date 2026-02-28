import { inject, injectable } from 'inversify';
import Store from '@store/Store.js';
import { Result, ok, err } from 'neverthrow';
import {
  ChallengeResult,
  DieFace,
  GameCode,
  PlayerId,
  GameStage,
  GameState,
  GameSettings,
  DEFAULT_GAME_SETTINGS,
  Claim,
  Player,
} from 'shared/domain.js';
import { ErrorCode } from 'shared/errors.js';
import { GetGameStatusResponse } from 'shared/api.js';
import { v4 as uuidv4 } from 'uuid';
import { generate } from 'random-words';

const MAX_PLAYERS = 6;

export function generateGameCode(): GameCode {
  return generate({
    exactly: 3,
    maxLength: 5,
    minLength: 4,
    join: '-',
    seed: Date.now().toString(),
  }) as GameCode;
}

export function generatePlayerId(): PlayerId {
  return uuidv4() as PlayerId;
}

export function createPlayer(id: PlayerId, name: string, startingDice: number): Player {
  return { id, name, remainingDice: startingDice, dice: [] };
}

function rollDie(): DieFace {
  return (Math.floor(Math.random() * 6) + 1) as DieFace;
}

export function rollPlayerDice(player: Player): Player {
  const dice: DieFace[] = [];
  for (let i = 0; i < player.remainingDice; i++) {
    dice.push(rollDie());
  }
  return { ...player, dice };
}

export function rollAllDice(game: GameState): GameState {
  return { ...game, players: game.players.map(rollPlayerDice) };
}

export function isClaimValid(newClaim: Claim, lastClaim: Claim | undefined): boolean {
  if (!lastClaim) return true;
  return (
    newClaim.quantity > lastClaim.quantity ||
    (newClaim.quantity === lastClaim.quantity && newClaim.faceValue > lastClaim.faceValue)
  );
}

export function validateTurn(game: GameState, playerId: PlayerId): Result<void, ErrorCode> {
  if (game.stage !== GameStage.ROUND_ROBIN) {
    return err(ErrorCode.ROUND_NOT_ACTIVE);
  }
  const currentPlayer = game.players[game.currentTurnIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) {
    return err(ErrorCode.OUT_OF_TURN);
  }
  return ok(undefined);
}

export function getInactivityMs(game: GameState): number {
  return Date.now() - game.lastActivityAt.getTime();
}

export function createGame(gameCode: GameCode, hostName: string): GameState {
  const hostId = generatePlayerId();
  const hostPlayer = createPlayer(hostId, hostName, DEFAULT_GAME_SETTINGS.startingDice);
  return {
    gameCode,
    hostId,
    players: [hostPlayer],
    eliminatedPlayers: [],
    claims: [],
    challengeResults: [],
    currentTurnIndex: 0,
    stage: GameStage.PRE_GAME,
    settings: { ...DEFAULT_GAME_SETTINGS },
    turnDeadline: null,
    createdAt: new Date(),
    lastActivityAt: new Date(),
  };
}

export function addPlayer(game: GameState, playerName: string): Result<{ game: GameState; playerId: PlayerId }, ErrorCode> {
  if (game.players.length >= MAX_PLAYERS) {
    return err(ErrorCode.GAME_FULL);
  }
  if (game.stage !== GameStage.PRE_GAME) {
    return err(ErrorCode.GAME_IN_PROGRESS);
  }

  const playerId = generatePlayerId();
  const player = createPlayer(playerId, playerName, game.settings.startingDice);
  return ok({
    game: {
      ...game,
      players: [...game.players, player],
      lastActivityAt: new Date(),
    },
    playerId,
  });
}

export function updateSettings(game: GameState, playerId: PlayerId, settings: Partial<GameSettings>): Result<GameState, ErrorCode> {
  if (playerId !== game.hostId) {
    return err(ErrorCode.UNAUTHORIZED);
  }
  if (game.stage !== GameStage.PRE_GAME) {
    return err(ErrorCode.GAME_IN_PROGRESS);
  }

  const newSettings = { ...game.settings, ...settings };
  const updatedPlayers = game.players.map(p => ({
    ...p,
    remainingDice: newSettings.startingDice,
  }));

  return ok({
    ...game,
    settings: newSettings,
    players: updatedPlayers,
    lastActivityAt: new Date(),
  });
}

export function reorderPlayers(game: GameState, playerId: PlayerId, newOrder: PlayerId[]): Result<GameState, ErrorCode> {
  if (playerId !== game.hostId) {
    return err(ErrorCode.UNAUTHORIZED);
  }
  if (game.stage !== GameStage.PRE_GAME) {
    return err(ErrorCode.GAME_IN_PROGRESS);
  }

  if (newOrder.length !== game.players.length) {
    return err(ErrorCode.INVALID_REQUEST);
  }

  const currentIds = new Set(game.players.map(p => p.id));
  const newIds = new Set(newOrder);
  if (newIds.size !== newOrder.length || !newOrder.every(id => currentIds.has(id))) {
    return err(ErrorCode.INVALID_REQUEST);
  }

  const playerMap = new Map(game.players.map(p => [p.id, p]));
  const reorderedPlayers = newOrder.map(id => playerMap.get(id)!);

  return ok({
    ...game,
    players: reorderedPlayers,
    lastActivityAt: new Date(),
  });
}

export function removePlayer(game: GameState, playerId: PlayerId): Result<{ game: GameState; newHostId: PlayerId | null }, ErrorCode> {
  const index = game.players.findIndex(p => p.id === playerId);
  if (index < 0) {
    return err(ErrorCode.PLAYER_NOT_FOUND);
  }

  const newPlayers = game.players.filter(p => p.id !== playerId);
  let newTurnIndex = game.currentTurnIndex;

  if (newTurnIndex >= newPlayers.length) {
    newTurnIndex = 0;
  }

  let newHostId: PlayerId | null = null;
  let hostId = game.hostId;

  if (playerId === game.hostId && newPlayers.length > 0) {
    hostId = newPlayers[0].id;
    newHostId = hostId;
  }

  return ok({
    game: {
      ...game,
      players: newPlayers,
      currentTurnIndex: newTurnIndex,
      hostId,
      lastActivityAt: new Date(),
    },
    newHostId,
  });
}

export interface LeaveGameResult {
  game: GameState;
  newHostId: PlayerId | null;
  gameOver: boolean;
  gameDestroyed: boolean;
}

export function leaveGame(game: GameState, playerId: PlayerId): Result<LeaveGameResult, ErrorCode> {
  const index = game.players.findIndex(p => p.id === playerId);
  if (index < 0) {
    return err(ErrorCode.PLAYER_NOT_FOUND);
  }

  const newPlayers = game.players.filter(p => p.id !== playerId);

  if (newPlayers.length === 0) {
    return ok({
      game: { ...game, players: [] },
      newHostId: null,
      gameOver: false,
      gameDestroyed: true,
    });
  }

  let newTurnIndex = game.currentTurnIndex;
  if (index < game.currentTurnIndex) {
    newTurnIndex = game.currentTurnIndex - 1;
  } else if (index === game.currentTurnIndex) {
    newTurnIndex = game.currentTurnIndex % newPlayers.length;
  }
  if (newTurnIndex >= newPlayers.length) {
    newTurnIndex = 0;
  }

  let newHostId: PlayerId | null = null;
  let hostId = game.hostId;
  if (playerId === game.hostId) {
    hostId = newPlayers[0].id;
    newHostId = hostId;
  }

  const isActiveGame = game.stage === GameStage.ROUND_ROBIN || game.stage === GameStage.POST_ROUND;
  const gameOver = isActiveGame && newPlayers.length === 1;
  const newStage = gameOver ? GameStage.POST_GAME : game.stage;

  return ok({
    game: {
      ...game,
      players: newPlayers,
      currentTurnIndex: newTurnIndex,
      hostId,
      stage: newStage,
      lastActivityAt: new Date(),
    },
    newHostId,
    gameOver,
    gameDestroyed: false,
  });
}

export function forfeitRound(game: GameState, playerId: PlayerId): Result<{ game: GameState; loserOut: boolean; gameOver: boolean }, ErrorCode> {
  const playerIndex = game.players.findIndex(p => p.id === playerId);
  if (playerIndex < 0) {
    return err(ErrorCode.PLAYER_NOT_FOUND);
  }

  let newPlayers = game.players.map(p =>
    p.id === playerId ? { ...p, remainingDice: p.remainingDice - 1 } : p
  );

  const loser = newPlayers.find(p => p.id === playerId);
  const loserOut = loser?.remainingDice === 0;

  let losers = game.eliminatedPlayers;
  if (loserOut) {
    losers = losers.concat(playerId);
  }

  let newTurnIndex = game.currentTurnIndex;
  if (newTurnIndex >= newPlayers.length) {
    newTurnIndex = 0;
  }

  const gameOver = newPlayers.length === 1;
  const newStage = gameOver ? GameStage.POST_GAME : GameStage.POST_ROUND;

  return ok({
    game: {
      ...game,
      players: newPlayers,
      currentTurnIndex: newTurnIndex,
      stage: newStage,
      lastActivityAt: new Date(),
      losers
    },
    loserOut,
    gameOver,
  });
}

export function sanitizeGameStateForPlayer(game: GameState, playerId: PlayerId): GameState {
  return {
    ...game,
    players: game.players.map(p => ({
      ...p,
      dice: p.id === playerId ? p.dice : [],
    })),
  };
}

export function addClaim(game: GameState, claim: Claim): Result<GameState, ErrorCode> {
  const turnValidation = validateTurn(game, claim.playerId);
  if (turnValidation.isErr()) {
    return err(turnValidation.error);
  }

  const lastClaim = game.claims[game.claims.length - 1];
  if (!isClaimValid(claim, lastClaim)) {
    return err(ErrorCode.INVALID_CLAIM);
  }

  const nextTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
  return ok({
    ...game,
    claims: [...game.claims, claim],
    currentTurnIndex: nextTurnIndex,
    lastActivityAt: new Date(),
  });
}

export function challenge(game: GameState, challengerId: PlayerId): Result<{ game: GameState; result: ChallengeResult }, ErrorCode> {
  const turnValidation = validateTurn(game, challengerId);
  if (turnValidation.isErr()) {
    return err(turnValidation.error);
  }
  if (game.claims.length === 0) {

    return err(ErrorCode.INVALID_CHALLENGE);
  }

  const lastClaim = game.claims[game.claims.length - 1];
  const { quantity, faceValue, playerId: claimerId } = lastClaim;

  const actualTotal = game.players.reduce(
    (total, player) => total + player.dice.filter(d => d === faceValue).length,
    0
  );

  const playerCounts = game.players.map(player => ({
    playerId: player.id,
    playerName: player.name,
    count: player.dice.filter(d => d === faceValue).length,
  }));

  const winnerId = actualTotal < quantity ? challengerId : claimerId;
  const loserId = winnerId === challengerId ? claimerId : challengerId;

  let newPlayers = game.players.map(p =>
    p.id === loserId ? { ...p, remainingDice: p.remainingDice - 1 } : p
  );

  const loser = newPlayers.find(p => p.id === loserId);
  const loserOut = loser?.remainingDice === 0;

  let losers = game.eliminatedPlayers;
  if (loserOut) {
    losers = losers.concat(loser.id)
  }
  const winnerIndex = newPlayers.findIndex(p => p.id === winnerId);
  const newTurnIndex = winnerIndex >= 0 ? winnerIndex : 0;

  const gameOver = newPlayers.length === 1;
  const newStage = gameOver ? GameStage.POST_GAME : GameStage.POST_ROUND;

  const challengeResult: ChallengeResult = {
    challengerId,
    claimerId,
    claimedQuantity: quantity,
    claimedFace: faceValue,
    actualTotal,
    playerCounts,
    winnerId,
    loserId,
    loserOut,
    gameOver,
  };

  return ok({
    game: {
      ...game,
      players: newPlayers,
      challengeResults: [...game.challengeResults, challengeResult],
      currentTurnIndex: newTurnIndex,
      stage: newStage,
      lastActivityAt: new Date(),
    },
    result: challengeResult,
  });
}

export function startGame(game: GameState, initiatorId: PlayerId): Result<GameState, ErrorCode> {
  if (initiatorId !== game.hostId) {
    return err(ErrorCode.UNAUTHORIZED);
  }
  if (game.stage !== GameStage.PRE_GAME) {
    return err(ErrorCode.GAME_IN_PROGRESS);
  }
  if (game.players.length < 2) {
    return err(ErrorCode.NOT_ENOUGH_PLAYERS);
  }

  const startingIndex = Math.floor(Math.random() * game.players.length);
  const rolledGame = rollAllDice(game);

  return ok({
    ...rolledGame,
    currentTurnIndex: startingIndex,
    claims: [],
    stage: GameStage.ROUND_ROBIN,
    lastActivityAt: new Date(),
  });
}

export function startRound(game: GameState, _initiatorId: PlayerId): Result<GameState, ErrorCode> {
  if (game.stage !== GameStage.PRE_GAME && game.stage !== GameStage.POST_ROUND) {
    return err(ErrorCode.INVALID_GAME_STATE);
  }

  const rolledGame = rollAllDice(game);

  return ok({
    ...rolledGame,
    claims: [],
    stage: GameStage.ROUND_ROBIN,
    lastActivityAt: new Date(),
  });
}

export function resetGame(game: GameState, playerId: PlayerId): Result<GameState, ErrorCode> {
  if (playerId !== game.hostId) {
    return err(ErrorCode.UNAUTHORIZED);
  }
  if (game.stage !== GameStage.POST_GAME) {
    return err(ErrorCode.INVALID_GAME_STATE);
  }

  const resetPlayers = game.players.map(p => ({
    ...p,
    remainingDice: game.settings.startingDice,
    dice: [],
  }));

  return ok({
    ...game,
    players: resetPlayers,
    claims: [],
    challengeResults: [],
    currentTurnIndex: 0,
    stage: GameStage.PRE_GAME,
    turnDeadline: null,
    lastActivityAt: new Date(),
  });
}

@injectable()
export default class GameService {
  constructor(@inject(Store) private store: Store) { }

  createGame(gameCode: GameCode, hostName: string): GameState {
    return createGame(gameCode, hostName);
  }

  addPlayer(gameCode: GameCode, playerName: string): Result<{ game: GameState; playerId: PlayerId }, ErrorCode> {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return err(gameResult.error);
    }

    const result = addPlayer(gameResult.value, playerName);
    if (result.isOk()) {
      this.store.setGame(result.value.game);
    }
    return result;
  }

  removePlayer(gameCode: GameCode, playerId: PlayerId): Result<{ game: GameState; newHostId: PlayerId | null }, ErrorCode> {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return err(gameResult.error);
    }

    const result = removePlayer(gameResult.value, playerId);
    if (result.isOk()) {
      this.store.setGame(result.value.game);
    }
    return result;
  }

  leaveGame(gameCode: GameCode, playerId: PlayerId): Result<LeaveGameResult, ErrorCode> {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return err(gameResult.error);
    }

    const result = leaveGame(gameResult.value, playerId);
    if (result.isOk()) {
      if (result.value.gameDestroyed) {
        this.store.removeGame(gameCode);
      } else {
        this.store.setGame(result.value.game);
      }
    }
    return result;
  }

  updateSettings(gameCode: GameCode, playerId: PlayerId, settings: Partial<GameSettings>): Result<GameSettings, ErrorCode> {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return err(gameResult.error);
    }

    const result = updateSettings(gameResult.value, playerId, settings);
    if (result.isOk()) {
      this.store.setGame(result.value);
      return ok(result.value.settings);
    }
    return err(result.error);
  }

  reorderPlayers(gameCode: GameCode, playerId: PlayerId, newOrder: PlayerId[]): Result<PlayerId[], ErrorCode> {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return err(gameResult.error);
    }

    const result = reorderPlayers(gameResult.value, playerId, newOrder);
    if (result.isOk()) {
      this.store.setGame(result.value);
      return ok(result.value.players.map(p => p.id));
    }
    return err(result.error);
  }

  resetGame(gameCode: GameCode, playerId: PlayerId): Result<GameState, ErrorCode> {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return err(gameResult.error);
    }

    const result = resetGame(gameResult.value, playerId);
    if (result.isOk()) {
      this.store.setGame(result.value);
    }
    return result;
  }

  getCurrentPlayer(gameCode: GameCode): Result<PlayerId, ErrorCode> {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return err(gameResult.error);
    }
    const game = gameResult.value;

    if (game.stage !== GameStage.ROUND_ROBIN || game.currentTurnIndex === undefined) {
      return err(ErrorCode.ROUND_NOT_ACTIVE);
    }

    const currentPlayer = game.players[game.currentTurnIndex];
    if (!currentPlayer) {
      return err(ErrorCode.PLAYER_NOT_FOUND);
    }
    return ok(currentPlayer.id);
  }

  makeClaim(gameCode: GameCode, playerId: PlayerId, faceValue: DieFace, quantity: number): Result<void, ErrorCode> {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return err(gameResult.error);
    }

    const claim: Claim = { playerId, quantity, faceValue };
    const result = addClaim(gameResult.value, claim);
    if (result.isOk()) {
      this.store.setGame(result.value);
    }
    return result.isOk() ? ok(undefined) : err(result.error);
  }

  makeChallenge(gameCode: GameCode, challengerId: PlayerId): Result<ChallengeResult, ErrorCode> {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return err(gameResult.error);
    }

    const result = challenge(gameResult.value, challengerId);
    if (result.isOk()) {
      this.store.setGame(result.value.game);
      return ok(result.value.result);
    }
    return err(result.error);
  }

  startRound(gameCode: GameCode, initiator: PlayerId): Result<{ startingPlayerId: PlayerId; dice: Record<PlayerId, DieFace[]> }, ErrorCode> {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return err(gameResult.error);
    }

    const result = startRound(gameResult.value, initiator);
    if (result.isErr()) {
      return err(result.error);
    }

    this.store.setGame(result.value);

    const startingPlayerId = result.value.players[result.value.currentTurnIndex].id;
    const dice = Object.fromEntries(
      result.value.players.map(p => [p.id, p.dice])
    ) as Record<PlayerId, DieFace[]>;

    return ok({ startingPlayerId, dice });
  }

  startRoundAuto(gameCode: GameCode): Result<{ startingPlayerId: PlayerId; dice: Record<PlayerId, DieFace[]> }, ErrorCode> {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return err(gameResult.error);
    }

    const game = gameResult.value;
    const hostId = game.hostId;

    const result = startRound(game, hostId);
    if (result.isErr()) {
      return err(result.error);
    }

    this.store.setGame(result.value);

    const startingPlayerId = result.value.players[result.value.currentTurnIndex].id;
    const dice = Object.fromEntries(
      result.value.players.map(p => [p.id, p.dice])
    ) as Record<PlayerId, DieFace[]>;

    return ok({ startingPlayerId, dice });
  }

  getGameByCode(gameCode: GameCode): Result<GameState, ErrorCode> {
    return this.store.getGame(gameCode);
  }

  startGame(gameCode: GameCode, initiator: PlayerId): Result<{ startingPlayerId: PlayerId; dice: Record<PlayerId, DieFace[]> }, ErrorCode> {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return err(gameResult.error);
    }

    const result = startGame(gameResult.value, initiator);
    if (result.isErr()) {
      return err(result.error);
    }

    this.store.setGame(result.value);

    const startingPlayerId = result.value.players[result.value.currentTurnIndex].id;
    const dice = Object.fromEntries(
      result.value.players.map(p => [p.id, p.dice])
    ) as Record<PlayerId, DieFace[]>;

    return ok({ startingPlayerId, dice });
  }

  handleDisconnect(gameCode: GameCode, playerId: PlayerId): Result<{ gameShutdown: boolean; removed: boolean; newHostId: PlayerId | null }, ErrorCode> {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return err(gameResult.error);
    }
    const game = gameResult.value;

    if (game.stage === GameStage.PRE_GAME || game.stage === GameStage.POST_GAME) {
      const removeResult = this.removePlayer(gameCode, playerId);
      if (removeResult.isErr()) {
        return err(removeResult.error);
      }

      if (game.stage === GameStage.PRE_GAME && removeResult.value.game.players.length === 0) {
        this.store.removeGame(gameCode);
        return ok({ gameShutdown: true, removed: true, newHostId: null });
      }
      return ok({ gameShutdown: false, removed: true, newHostId: removeResult.value.newHostId });
    }

    return ok({ gameShutdown: false, removed: false, newHostId: null });
  }

  getGameState(playerId: PlayerId, gameCode: GameCode): Result<GameState, ErrorCode> {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return err(gameResult.error);
    }
    const game = gameResult.value;

    const playerExists = game.players.some(p => p.id === playerId);
    if (!playerExists) {
      return err(ErrorCode.PLAYER_NOT_FOUND);
    }
    return ok(game);
  }

  getGameStateForPlayer(playerId: PlayerId, gameCode: GameCode): Result<GameState, ErrorCode> {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return err(gameResult.error);
    }
    const game = gameResult.value;

    const playerExists = game.players.some(p => p.id === playerId);
    if (!playerExists) {
      return err(ErrorCode.PLAYER_NOT_FOUND);
    }
    return ok(sanitizeGameStateForPlayer(game, playerId));
  }

  getPlayerRemainingDice(playerId: PlayerId, gameCode: GameCode): Result<number, ErrorCode> {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return err(gameResult.error);
    }

    const player = gameResult.value.players.find(p => p.id === playerId);
    if (!player) {
      return err(ErrorCode.PLAYER_NOT_FOUND);
    }
    return ok(player.remainingDice);
  }

  getPlayerDice(playerId: PlayerId, gameCode: GameCode): Result<DieFace[], ErrorCode> {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return err(gameResult.error);
    }

    const player = gameResult.value.players.find(p => p.id === playerId);
    if (!player) {
      return err(ErrorCode.PLAYER_NOT_FOUND);
    }
    return ok(player.dice);
  }

  isPlayerInGame(gameCode: GameCode, playerId: PlayerId): boolean {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return false;
    }
    return gameResult.value.players.some(p => p.id === playerId);
  }

  setTurnDeadline(gameCode: GameCode, deadline: Date | null): Result<void, ErrorCode> {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return err(gameResult.error);
    }

    this.store.setGame({
      ...gameResult.value,
      turnDeadline: deadline,
    });
    return ok(undefined);
  }

  forfeitRound(gameCode: GameCode, playerId: PlayerId): Result<{ game: GameState; loserOut: boolean; gameOver: boolean }, ErrorCode> {
    const gameResult = this.store.getGame(gameCode);
    if (gameResult.isErr()) {
      return err(gameResult.error);
    }

    const result = forfeitRound(gameResult.value, playerId);
    if (result.isOk()) {
      this.store.setGame(result.value.game);
    }
    return result;
  }

  createNewGame(hostName: string): Result<{ gameCode: GameCode; hostId: PlayerId }, ErrorCode> {
    let gameCode: GameCode;
    while (this.store.hasGame((gameCode = generateGameCode()))) { }

    const game = createGame(gameCode, hostName);
    const setGameResult = this.store.setGame(game);
    if (setGameResult.isErr()) {
      return err(setGameResult.error);
    }
    return ok({ gameCode, hostId: game.hostId });
  }

  getGameStatus(gameCode: GameCode, playerId?: PlayerId): GetGameStatusResponse {
    const gameResult = this.store.getGame(gameCode);

    if (gameResult.isErr()) {
      return { exists: false, joinable: false };
    }

    const game = gameResult.value;
    const isJoinable = game.stage === GameStage.PRE_GAME && game.players.length < MAX_PLAYERS;
    const reason = !isJoinable
      ? (game.stage !== GameStage.PRE_GAME ? 'Game has already started' : 'Game is full')
      : undefined;

    const response: GetGameStatusResponse = {
      exists: true,
      joinable: isJoinable,
      reason,
      game,
    };

    if (playerId) {
      response.isMember = game.players.some(p => p.id === playerId);
    }

    return response;
  }
}
