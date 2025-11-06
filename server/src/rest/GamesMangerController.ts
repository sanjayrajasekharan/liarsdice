import { Request, Response } from 'express';
import { controller, httpGet, httpPost, request, requestBody, requestParam, response } from "inversify-express-utils";
import { inject, injectable } from 'inversify';
import { PlayerId } from '../../../shared/types';
import GamesManagerService from '../app/GamesMangerService';
import { isErr } from '../../../shared/Result';

@controller('/api/games')
export default class GamesController {
    constructor (@inject("GamesService") private gamesService: GamesManagerService) { }
    @httpPost("/")
    private async createGame(@requestBody() body: { hostId: PlayerId }, @response() res: Response) {
        const createGameResult = await this.gamesService.createGame(body.hostId);
        if (isErr(createGameResult)) {
            return res.status(400).json({ error: createGameResult.error });
        }
        return res.status(201).json({ message: 'Game created', gameCode: createGameResult.value });
    }

    @httpPost("/:gameCode/players")
    private async addPlayerToGame(@requestParam("gameCode") gameCode: string, @requestBody() req: { playerId: PlayerId }, @response() res: Response) {
        const addPlayerResult = await this.gamesService.addPlayerToGame(gameCode, req.playerId);
        if (isErr(addPlayerResult)) {
            return res.status(400).json({ error: addPlayerResult.error });
        }
        return res.status(201).json({ message: 'Player added', gameCode });
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