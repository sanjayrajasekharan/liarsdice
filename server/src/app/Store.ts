import { WebSocket } from 'ws';
import { PlayerId, GameCode } from '../../../shared/types';
import { Game } from '../game/Game';
import { Result, Err, Ok } from '../../../shared/Result';
import {ErrorCode} from '../../../shared/errors'
import { injectable } from 'inversify';

@injectable()
export default class Store {
private  connections: Record<string, Record<PlayerId, WebSocket>> = {};
private  games: Record<GameCode, Game> = {};

     addConnection(gameCode: string, playerId: PlayerId, ws: WebSocket): Result<void> {
        if (!this.connections[gameCode]) {
            return Err(ErrorCode.GAME_NOT_FOUND);
        }
        this.connections[gameCode][playerId] = ws;
        return Ok(undefined);  
    }

     getConnection(gameCode: string, playerId: PlayerId): Result<WebSocket> {
        if (!this.connections[gameCode])
            return Err(ErrorCode.GAME_NOT_FOUND);
        if (!this.connections[gameCode][playerId])
            return Err(ErrorCode.PLAYER_NOT_FOUND);
        return Ok(this.connections[gameCode][playerId]);
    }

     removeConnection(gameCode: string, playerId: PlayerId): Result<void> {
        if (!this.connections[gameCode]) {
            return Err(ErrorCode.GAME_NOT_FOUND);
        }
        if (!this.connections[gameCode][playerId]) {
            return Err(ErrorCode.PLAYER_NOT_FOUND);
        }
        delete this.connections[gameCode][playerId];
        return Ok(undefined);
    }

     getConnectionsForGame(gameCode: string): Result<Record<PlayerId, WebSocket>> {
        if (!this.connections[gameCode]) {
            return Err(ErrorCode.GAME_NOT_FOUND);
        }
        return Ok(this.connections[gameCode]);
    }

     addGame(gameCode: GameCode, game: Game): void {
        this.games[gameCode] = game;
        this.connections[gameCode] = {};
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