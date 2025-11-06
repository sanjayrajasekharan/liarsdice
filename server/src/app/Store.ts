import { PlayerId, GameCode, SocketId } from '../../../shared/types';
import { Game } from '../game/Game';
import { Result, Err, Ok } from '../../../shared/Result';
import {ErrorCode} from '../../../shared/errors'
import { injectable } from 'inversify';

@injectable()
export default class Store {
private connections: Record<GameCode, Record<PlayerId, SocketId>> = {};
private games: Record<GameCode, Game> = {};

     addConnection(gameCode: GameCode, playerId: PlayerId, socketId: SocketId): Result<void> {
        if (!this.connections[gameCode]) {
            return Err(ErrorCode.GAME_NOT_FOUND);
        }
        this.connections[gameCode][playerId] = socketId;
        return Ok(undefined);  
    }

     getConnection(gameCode: string, playerId: PlayerId): Result<SocketId> {
        if (!this.connections[gameCode])
            return Err(ErrorCode.GAME_NOT_FOUND);
        if (!this.connections[gameCode][playerId])
            return Err(ErrorCode.PLAYER_NOT_FOUND);
        return Ok(this.connections[gameCode][playerId]);
    }

     removeConnection(gameCode: GameCode, playerId: PlayerId): Result<void> {
        if (!this.connections[gameCode]) {
            return Err(ErrorCode.GAME_NOT_FOUND);
        }
        if (!this.connections[gameCode][playerId]) {
            return Err(ErrorCode.PLAYER_NOT_FOUND);
        }
        delete this.connections[gameCode][playerId];
        return Ok(undefined);
    }

     getConnectionsForGame(gameCode: GameCode): Result<Record<PlayerId, SocketId>> {
        if (!this.connections[gameCode]) {
            return Err(ErrorCode.GAME_NOT_FOUND);
        }
        return Ok(this.connections[gameCode]);
    }

     addGame(game: Game): Result<void> {
        const gameCode = game.getGameCode();
        if (this.games[gameCode]) {
            return Err(ErrorCode.GAME_ALREADY_EXISTS);
        }
        this.games[gameCode] = game;
        this.connections[gameCode] = {};
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
        delete this.connections[gameCode];
        return Ok(undefined);
    }
}