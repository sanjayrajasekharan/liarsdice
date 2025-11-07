import { PlayerId, GameCode, SocketId } from '../../../shared/types';
import { Game } from '../game/Game';
import { Result, Err, Ok } from '../../../shared/Result';
import {ErrorCode} from '../../../shared/errors'
import { injectable } from 'inversify';

@injectable()
export default class Store {
private games: Record<GameCode, Game> = {};
     addGame(game: Game): Result<void> {
        const gameCode = game.getGameCode();
        if (this.games[gameCode]) {
            return Err(ErrorCode.GAME_ALREADY_EXISTS);
        }
        this.games[gameCode] = game;
        return Ok(undefined);
    }

     getGame(gameCode: GameCode): Result<Game> {
        const game = this.games[gameCode];
        if (!game) {
            return Err(ErrorCode.GAME_NOT_FOUND);
        }
        return Ok(game);
    }
    
     removeGame(gameCode: GameCode): Result<void> {
        if (!this.games[gameCode]) {
            return Err(ErrorCode.GAME_NOT_FOUND);
        }
        delete this.games[gameCode];
        // TODO : Clean up connections associated with this game
        return Ok(undefined);
    }
}