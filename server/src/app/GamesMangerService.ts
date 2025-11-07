import { inject, injectable } from "inversify";
import Store from "./Store";
import { Err, isErr, isOk, Ok, Result } from "../../../shared/Result";
import { GameCode, PlayerId } from "../../../shared/types";
import { Game } from "../game/Game";

@injectable()
export default class GamesManagerService {
    constructor(@inject("Store") private store: Store) { }

    async createGame(hostName: string): Promise<Result<{gameCode: GameCode, hostId: PlayerId}>> {
        let gameCode: GameCode;
        while (isOk(this.store.getGame(gameCode = Game.generateGameCode()))) { }

        const game = Game.createGame(gameCode, hostName);
        const addGameResult = this.store.addGame(game);
        if (isErr(addGameResult)) {
            return Err(addGameResult.error);
        }
        return Ok({ gameCode, hostId: game.getHostId() });
    }

    async addPlayerToGame(gameCode: GameCode, playerName: string): Promise<Result<PlayerId>> {
        const gameResult = await this.getGame(gameCode);
        if (isErr(gameResult)) {
            return Err(gameResult.error);
        }
        const game = gameResult.value;
        const playerCreationResult = game.createPlayer(playerName);
        if (isErr(playerCreationResult)) {
            return Err(playerCreationResult.error);
        }
        const playerId = playerCreationResult.value.playerId;
        return Ok(playerId);
    }

    async getGame(gameCode: GameCode): Promise<Result<Game>> {
        return this.store.getGame(gameCode);
    }
}