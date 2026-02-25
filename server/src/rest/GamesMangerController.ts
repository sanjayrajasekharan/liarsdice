import { Response } from 'express';
import { controller, httpGet, httpPost, request, requestBody, requestParam, response } from "inversify-express-utils";
import { inject } from 'inversify';
import GamesManagerService from '@app/GamesMangerService.js';
import { generatePlayerToken } from '@auth/utils.js';
import {
  CreateGameRequestSchema,
  AddPlayerRequestSchema,
  GameCodeParamSchema,
  CheckMembershipParamsSchema,
} from 'shared/api.js';
import { GameCode, PlayerId } from 'shared/domain.js';

@controller('/api/games')
export default class GamesManagerController {
  constructor(@inject(GamesManagerService) private gamesService: GamesManagerService) { }
  @httpPost("/")
  private async createGame(@requestBody() body: { hostName: string }, @response() res: Response) {
    console.log("game created");
    const validationResult = CreateGameRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.issues[0].message });
    }

    const createGameResult = await this.gamesService.createGame(validationResult.data.hostName);
    if (createGameResult.isErr()) {
      return res.status(400).json({ error: createGameResult.error });
    }
    const { gameCode, hostId } = createGameResult.value;
    return res.status(201).json({ message: 'Game created', gameCode, playerId: hostId, token: generatePlayerToken(hostId, validationResult.data.hostName, gameCode) });
  }

  @httpPost("/:gameCode/players")
  private async addPlayerToGame(@requestParam("gameCode") gameCode: string, @requestBody() req: { playerName: string }, @response() res: Response) {
    const paramValidation = GameCodeParamSchema.safeParse({ gameCode });
    if (!paramValidation.success) {
      return res.status(400).json({ error: paramValidation.error.issues[0].message });
    }

    const bodyValidation = AddPlayerRequestSchema.safeParse(req);
    if (!bodyValidation.success) {
      return res.status(400).json({ error: bodyValidation.error.issues[0].message });
    }

    const addPlayerResult = await this.gamesService.addPlayerToGame(gameCode as GameCode, bodyValidation.data.playerName);
    if (addPlayerResult.isErr()) {
      return res.status(400).json({ error: addPlayerResult.error });
    }
    const playerId = addPlayerResult.value;
    const token = generatePlayerToken(playerId, bodyValidation.data.playerName, gameCode as GameCode);
    return res.status(201).json({ message: 'Player added', gameCode, playerId, token });
  }

  @httpGet("/:gameCode")
  private async getGame(@requestParam("gameCode") gameCode: string, @response() res: Response) {
    const paramValidation = GameCodeParamSchema.safeParse({ gameCode });
    if (!paramValidation.success) {
      return res.status(400).json({ error: paramValidation.error.issues[0].message });
    }

    const getGameResult = await this.gamesService.getGame(gameCode as GameCode);
    if (getGameResult.isErr()) {
      return res.status(404).json({ error: getGameResult.error });
    }
    let game = getGameResult.value;
    return res.status(200).json({ game });
  }

  @httpGet("/:gameCode/players/:playerId")
  private checkMembership(
    @requestParam("gameCode") gameCode: string,
    @requestParam("playerId") playerId: string,
    @response() res: Response
  ) {
    const paramValidation = CheckMembershipParamsSchema.safeParse({ gameCode, playerId });
    if (!paramValidation.success) {
      return res.status(400).json({ error: paramValidation.error.issues[0].message });
    }

    const result = this.gamesService.checkMembership(gameCode as GameCode, playerId as PlayerId);
    return res.status(200).json(result);
  }

  @httpGet("/:gameCode/joinable")
  private checkJoinable(
    @requestParam("gameCode") gameCode: string,
    @response() res: Response
  ) {
    const paramValidation = GameCodeParamSchema.safeParse({ gameCode });
    if (!paramValidation.success) {
      return res.status(400).json({ error: paramValidation.error.issues[0].message });
    }

    const result = this.gamesService.checkJoinable(gameCode as GameCode);
    return res.status(200).json(result);
  }
}
