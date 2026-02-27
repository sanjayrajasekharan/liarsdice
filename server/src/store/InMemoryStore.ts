import { GameCode, GameState } from 'shared/domain.js';
import { Result, ok, err } from 'neverthrow';
import { ErrorCode } from 'shared/errors.js';
import { injectable } from 'inversify';
import Store from './Store.js';

@injectable()
export default class InMemoryStore extends Store {
    private games: Record<GameCode, GameState> = {} as Record<GameCode, GameState>;

    getGame(gameCode: GameCode): Result<GameState, ErrorCode> {
        const game = this.games[gameCode];
        if (!game) {
            return err(ErrorCode.GAME_NOT_FOUND);
        }
        return ok(game);
    }

    setGame(game: GameState): Result<void, ErrorCode> {
        this.games[game.gameCode] = game;
        return ok(undefined);
    }

    removeGame(gameCode: GameCode): Result<void, ErrorCode> {
        if (!this.games[gameCode]) {
            return err(ErrorCode.GAME_NOT_FOUND);
        }
        delete this.games[gameCode];
        return ok(undefined);
    }

    hasGame(gameCode: GameCode): boolean {
        return gameCode in this.games;
    }
}
