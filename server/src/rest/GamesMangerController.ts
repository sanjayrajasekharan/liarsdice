import { Response } from 'express';
import { controller, httpGet, httpPost, queryParam, requestBody, requestParam, response } from "inversify-express-utils";
import { inject } from 'inversify';
import GameService from '@app/GameService.js';
import { generatePlayerToken } from '@auth/utils.js';
import {
  CreateGameRequestSchema,
  AddPlayerRequestSchema,
  GameCodeParamSchema,
} from 'shared/api.js';
import { GameCode, PlayerId } from 'shared/domain.js';

@controller('/api/games')
export default class GamesManagerController {
  constructor(@inject(GameService) private gameService: GameService) { }

  @httpPost("/")
  private createGame(@requestBody() body: { hostName: string }, @response() res: Response) {
    const validationResult = CreateGameRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.issues[0].message });
    }

    const createGameResult = this.gameService.createNewGame(validationResult.data.hostName);
    if (createGameResult.isErr()) {
      return res.status(400).json({ error: createGameResult.error });
    }
    const { gameCode, hostId } = createGameResult.value;
    return res.status(201).json({
      message: 'Game created',
      gameCode,
      playerId: hostId,
      token: generatePlayerToken(hostId, validationResult.data.hostName, gameCode)
    });
  }

  @httpPost("/:gameCode/players")
  private addPlayer(
    @requestParam("gameCode") gameCode: string,
    @requestBody() body: { playerName: string },
    @response() res: Response
  ) {
    const paramValidation = GameCodeParamSchema.safeParse({ gameCode });
    if (!paramValidation.success) {
      return res.status(400).json({ error: paramValidation.error.issues[0].message });
    }

    const bodyValidation = AddPlayerRequestSchema.safeParse(body);
    if (!bodyValidation.success) {
      return res.status(400).json({ error: bodyValidation.error.issues[0].message });
    }

    const addPlayerResult = this.gameService.addPlayer(gameCode as GameCode, bodyValidation.data.playerName);
    if (addPlayerResult.isErr()) {
      return res.status(400).json({ error: addPlayerResult.error });
    }

    const playerId = addPlayerResult.value.playerId;
    const token = generatePlayerToken(playerId, bodyValidation.data.playerName, gameCode as GameCode);
    return res.status(201).json({ message: 'Player added', gameCode, playerId, token });
  }

  @httpGet("/:gameCode")
  private getGameStatus(
    @requestParam("gameCode") gameCode: string,
    @queryParam("playerId") playerId: string | undefined,
    @response() res: Response
  ) {
    const paramValidation = GameCodeParamSchema.safeParse({ gameCode });
    if (!paramValidation.success) {
      return res.status(400).json({ error: paramValidation.error.issues[0].message });
    }

    const result = this.gameService.getGameStatus(
      gameCode as GameCode,
      playerId ? playerId as PlayerId : undefined
    );
    return res.status(200).json(result);
  }
}
