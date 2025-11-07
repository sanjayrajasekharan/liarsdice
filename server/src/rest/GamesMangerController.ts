import { Request, Response } from 'express';
import { controller, httpGet, httpPost, request, requestBody, requestParam, response } from "inversify-express-utils";
import { inject, injectable } from 'inversify';
import { PlayerId } from '../../../shared/types';
import GamesManagerService from '../app/GamesMangerService';
import { isErr } from '../../../shared/Result';
import { generatePlayerToken } from '../auth/utils';
import { hostname } from 'os';
import { generate } from 'random-words';

// TODO: Make sure playerId is generated server-side and not passed from client
@controller('/api/games')
export default class GamesManagerController {
    constructor (@inject("GamesManagerService") private gamesService: GamesManagerService) { }
    @httpPost("/")
    private async createGame(@requestBody() body: { hostName: string }, @response() res: Response) {
        const createGameResult = await this.gamesService.createGame(body.hostName);
        if (isErr(createGameResult)) {
            return res.status(400).json({ error: createGameResult.error });
        }
        const { gameCode, hostId } = createGameResult.value;
        return res.status(201).json({ message: 'Game created', gameCode, token: generatePlayerToken(hostId, body.hostName, gameCode) });
    }

    @httpPost("/:gameCode/players")
    private async addPlayerToGame(@requestParam("gameCode") gameCode: string, @requestBody() req: { playerName: string }, @response() res: Response) {
        const addPlayerResult = await this.gamesService.addPlayerToGame(gameCode, req.playerName);
        if (isErr(addPlayerResult)) {
            return res.status(400).json({ error: addPlayerResult.error });
        }
        const playerId = addPlayerResult.value;
        const token = generatePlayerToken(playerId, req.playerName, gameCode);
        return res.status(201).json({ message: 'Player added', gameCode, token });
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