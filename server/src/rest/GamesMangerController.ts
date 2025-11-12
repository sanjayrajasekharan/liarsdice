import { Response } from 'express';
import { controller, httpGet, httpPost, request, requestBody, requestParam, response } from "inversify-express-utils";
import { inject } from 'inversify';
import GamesManagerService from '@app/GamesMangerService.js';
import { isErr } from 'shared/Result.js';
import { generatePlayerToken } from '@auth/utils.js';

@controller('/api/games')
export default class GamesManagerController {
    constructor (@inject(GamesManagerService) private gamesService: GamesManagerService) { }
    @httpPost("/")
    private async createGame(@requestBody() body: { hostName: string }, @response() res: Response) {
        const createGameResult = await this.gamesService.createGame(body.hostName);
        if (isErr(createGameResult)) {
            return res.status(400).json({ error: createGameResult.error });
        }
        const { gameCode, hostId } = createGameResult.value;
        return res.status(201).json({ message: 'Game created', gameCode, playerId: hostId, token: generatePlayerToken(hostId, body.hostName, gameCode) });
    }

    @httpPost("/:gameCode/players")
    private async addPlayerToGame(@requestParam("gameCode") gameCode: string, @requestBody() req: { playerName: string }, @response() res: Response) {
        const addPlayerResult = await this.gamesService.addPlayerToGame(gameCode, req.playerName);
        if (isErr(addPlayerResult)) {
            return res.status(400).json({ error: addPlayerResult.error });
        }
        const playerId = addPlayerResult.value;
        const token = generatePlayerToken(playerId, req.playerName, gameCode);
        return res.status(201).json({ message: 'Player added', gameCode, playerId, token });
    }

    @httpGet("/:gameCode")
    private async getGame(@requestParam("gameCode") gameCode: string, @response() res: Response) {
        const getGameResult = await this.gamesService.getGame(gameCode);
        if (isErr(getGameResult)) {
            return res.status(404).json({ error: getGameResult.error });
        }
        let game = getGameResult.value;
        return res.status(200).json({ game });
    }
}