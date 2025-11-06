import express, { Request, Response } from 'express';
import { controller, httpGet, httpPost, request, requestParam, response } from "inversify-express-utils";
import App from '../app/App';
import { injectable } from 'inversify';

@injectable()
@controller('/api/games')
export default class GamesController {
    @httpPost("/")
    private async createGame(@request() req: Request, @response() res: Response) {
        // Logic to create a new game
        return res.status(201).json({ message: 'Game created' });
    }

    @httpPost("/:gameCode/players")
    private async addPlayer(@requestParam("gameCode") gameCode: string, @request() req: Request, @response() res: Response) {
        // Logic to add a player to the game
        return res.status(201).json({ message: 'Player added', gameCode });
    }

    @httpGet("/:gameCode")
    private async getGames(@requestParam("gameCode") gameCode: string, @response() res: Response) {
        return res.status(200).json({ gameCode });
    }
}