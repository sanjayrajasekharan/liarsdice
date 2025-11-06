import { inject, injectable } from "inversify";
import Store from "./Store";
import { Err, isErr, isOk, Ok, Result } from "../../../shared/Result";
import { GameCode, PlayerId } from "../../../shared/types";
import { Game } from "../game/Game";

@injectable()
export default class GamesService {
    constructor(@inject("Store") private store: Store) { }

    async createGame(hostId: PlayerId): Promise<Result<GameCode>> {
        let gameCode: GameCode;
        while (isOk(this.store.getGame(gameCode = Game.generateGameCode()))) { }

        const game = new Game(gameCode, hostId);
        const addGameResult = this.store.addGame(game);
        if (isErr(addGameResult)) {
            return Err(addGameResult.error);
        }
        return Ok(gameCode);
    }

    async addPlayerToGame(gameCode: GameCode, playerId: PlayerId): Promise<Result<void>> {
        const gameResult = await this.getGame(gameCode);
        if (isErr(gameResult)) {
            return Err(gameResult.error);
        }
        const game = gameResult.value;
        const playerCreationResult = game.createPlayer(playerId);
        if (isErr(playerCreationResult)) {
            return Err(playerCreationResult.error);
        }
        return Ok(undefined);
    }

    async getGame(gameCode: GameCode): Promise<Result<Game>> {
        return this.store.getGame(gameCode);
    }
}