import { Game, Result } from './game/Game';
import { generate } from 'random-words';
import { ErrorCode } from '../shared/types';
import { Player } from './game/Player';

const games: Map<string, Game> = new Map();

export function createGame(hostId: string, hostName: string): string {
  let gameCode: string;

  do {
    gameCode = generate({
      exactly: 3,
      maxLength: 5,
      minLength: 4,
      join: "-",
      seed: Date.now().toString(),
    });
  } while (games.has(gameCode));

  const game = new Game(gameCode);
  game.addPlayer(hostId, hostName, true);
  games.set(gameCode, game);
  return gameCode;
}

export function joinGame(gameCode: string, playerId: string, playerName: string): Result<Player, ErrorCode> {
  const game = games.get(gameCode);
  if (!game) return { ok: false, error: ErrorCode.GAME_NOT_FOUND };
  return game.addPlayer(playerId, playerName, false);
}

export function getGame(gameCode: string): Game | undefined {
  return games.get(gameCode);
}

export function gameExists(gameCode: string): boolean {
  return games.has(gameCode);
}

export function playerInGame(gameCode: string, playerId: string): boolean {
  const game = games.get(gameCode);
  return !!game?.hasPlayer(playerId);
}

export function removePlayer(gameCode: string, playerId: string): void {
  const game = games.get(gameCode);
  if (!game) return;

  game.removePlayer(playerId);
  if (game.isEmpty()) {
    games.delete(gameCode);
  }
}
