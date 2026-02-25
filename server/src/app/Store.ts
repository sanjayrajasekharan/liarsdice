import { PlayerId, GameCode, SocketId, GameStage } from 'shared/domain.js';
import { Game } from '@game/Game.js';
import { Result, ok, err } from 'neverthrow';
import { ErrorCode } from 'shared/errors.js';
import { injectable } from 'inversify';

@injectable()
export default class Store {
private games: Record<GameCode, Game> = {} as Record<GameCode, Game>;
     addGame(game: Game): Result<void, ErrorCode> {
        const gameCode = game.getGameCode();
        if (this.games[gameCode]) {
            return err(ErrorCode.GAME_ALREADY_EXISTS);
        }
        this.games[gameCode] = game;
        return ok(undefined);
    }

     getGame(gameCode: GameCode): Result<Game, ErrorCode> {
        const game = this.games[gameCode];
        if (!game) {
            return err(ErrorCode.GAME_NOT_FOUND);
        }
        
        // Passive cleanup: check if game is stale on access
        if (this.isGameStale(game)) {
            console.log(`Removing stale game on access: ${gameCode}`);
            delete this.games[gameCode];
            return err(ErrorCode.GAME_NOT_FOUND);
        }
        
        return ok(game);
    }
    
     removeGame(gameCode: GameCode): Result<void, ErrorCode> {
        if (!this.games[gameCode]) {
            return err(ErrorCode.GAME_NOT_FOUND);
        }
        delete this.games[gameCode];
        return ok(undefined);
    }

    getAllGames(): Game[] {
        return Object.values(this.games);
    }

    private isGameStale(game: Game): boolean {
        const inactiveMs = game.getInactivityMs();
        
        // Empty games -> 5 min grace period for reconnection
        if (game.getPlayers().length === 0) {
            return inactiveMs > 5 * 60 * 1000;
        }
        
        // PRE_GAME games -> 30 min timeout
        if (game.getStage() === GameStage.PRE_GAME) {
            return inactiveMs > 30 * 60 * 1000;
        }
        
        // POST_GAME games -> 10 min timeout
        if (game.getStage() === GameStage.POST_GAME) {
            return inactiveMs > 10 * 60 * 1000;
        }
        
        // Active games (ROUND_ROBIN, POST_ROUND) -> 2 hour timeout
        return inactiveMs > 2 * 60 * 60 * 1000;
    }

    cleanupStaleGames(): number {
        const games = this.getAllGames();
        let cleanedCount = 0;
        
        for (const game of games) {
            if (this.isGameStale(game)) {
                const gameCode = game.getGameCode();
                console.log(`Cleaning up stale game: ${gameCode} (stage: ${game.getStage()}, inactive: ${Math.floor(game.getInactivityMs() / 1000)}s)`);
                delete this.games[gameCode];
                cleanedCount++;
            }
        }
        
        return cleanedCount;
    }
}