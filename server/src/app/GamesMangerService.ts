import { inject, injectable } from "inversify";
import Store from "./Store";
import { Result, ok, err } from "neverthrow";
import { GameCode, GameStage, PlayerId } from "shared/domain.js";
import { Game } from "@game/Game";
import { ErrorCode } from "shared/errors.js";

@injectable()
export default class GamesManagerService {
    constructor(@inject(Store) private store: Store) { }

    async createGame(hostName: string): Promise<Result<{gameCode: GameCode, hostId: PlayerId}, ErrorCode>> {
        let gameCode: GameCode;
        while (this.store.getGame(gameCode = Game.generateGameCode()).isOk()) { }

        const game = Game.createGame(gameCode, hostName);
        const addGameResult = this.store.addGame(game);
        if (addGameResult.isErr()) {
            return err(addGameResult.error);
        }
        return ok({ gameCode, hostId: game.getHostId() });
    }

    async addPlayerToGame(gameCode: GameCode, playerName: string): Promise<Result<PlayerId, ErrorCode>> {
        const gameResult = await this.getGame(gameCode);
        if (gameResult.isErr()) {
            return err(gameResult.error);
        }
        const game = gameResult.value;
        const playerCreationResult = game.createPlayer(playerName);
        if (playerCreationResult.isErr()) {
            return err(playerCreationResult.error);
        }
        const playerId = playerCreationResult.value.playerId;
        return ok(playerId);
    }

    async getGame(gameCode: GameCode): Promise<Result<Game, ErrorCode>> {
        return this.store.getGame(gameCode);
    }

    checkMembership(gameCode: GameCode, playerId: PlayerId): { gameExists: boolean, isMember: boolean } {
        const gameResult = this.store.getGame(gameCode);
        if (gameResult.isErr()) {
            return { gameExists: false, isMember: false };
        }
        const game = gameResult.value;
        const isMember = game.getPlayers().some(p => p.getId() === playerId);
        return { gameExists: true, isMember };
    }

    checkJoinable(gameCode: GameCode): { joinable: boolean, reason?: string } {
        const gameResult = this.store.getGame(gameCode);
        if (gameResult.isErr()) {
            return { joinable: false, reason: 'Game not found' };
        }
        const game = gameResult.value;
        if (game.getStage() !== GameStage.PRE_GAME) {
            return { joinable: false, reason: 'Game has already started' };
        }
        if (game.getPlayers().length >= 6) {
            return { joinable: false, reason: 'Game is full' };
        }
        return { joinable: true };
    }
}