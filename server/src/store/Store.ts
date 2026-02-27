import { GameCode, GameState } from 'shared/domain.js';
import { Result } from 'neverthrow';
import { ErrorCode } from 'shared/errors.js';

export default abstract class Store {
    abstract getGame(gameCode: GameCode): Result<GameState, ErrorCode>;
    abstract setGame(game: GameState): Result<void, ErrorCode>;
    abstract removeGame(gameCode: GameCode): Result<void, ErrorCode>;
    abstract hasGame(gameCode: GameCode): boolean;
}
