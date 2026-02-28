import { ClaimPayloadSchema, ActionResponse, ClientToServerEvents, UpdateSettingsPayloadSchema, ReorderPlayersPayloadSchema } from "shared/client-events.js";
import { ServerToClientEvents, PlayerJoinedPayload, PlayerLeftPayload, ClaimMadePayload, ChallengeMadePayload, GameStartedPayload, RoundStartedPayload, DiceRolledPayload, PlayerForfeitPayload, GameEndedPayload, SettingsUpdatedPayload, PlayersReorderedPayload, GameResetPayload } from "shared/server-events.js";
import { onConnect, socketController, event, onDisconnect } from "@sockets/socket-utils/main";
import { Socket as BaseSocket, Server as BaseServer } from "socket.io";
import { inject } from "inversify";
import GameService from "@app/GameService.js";
import TurnTimerService from "@app/TurnTimerService.js";
import RoundTimerService from "@app/RoundTimerService.js";
import { DieFace, GameCode, GameSettings, GameStage, PlayerId } from "shared/domain.js";
import { getErrorMessage } from "shared/errors.js";
import { authMiddleware } from "@sockets/middleware/authMiddleware.js";

type Socket = BaseSocket<ClientToServerEvents, ServerToClientEvents>;
type Server = BaseServer<ClientToServerEvents, ServerToClientEvents>;

@socketController(undefined, authMiddleware)
export class GameController {
  constructor(
    @inject(GameService) private gameService: GameService,
    @inject(TurnTimerService) private turnTimerService: TurnTimerService,
    @inject(RoundTimerService) private roundTimerService: RoundTimerService,
    @inject(BaseServer) private io: Server
  ) { }

  @onConnect()
  handleConnect(socket: Socket) {
    const playerId: PlayerId = socket.data.playerId!;
    const gameCode: GameCode = socket.data.gameCode!;
    const playerName: string = socket.data.playerName!;

    if (playerId === undefined || gameCode === undefined || playerName === undefined) {
      throw new Error('Missing authentication data');
    }

    socket.join(gameCode);
    socket.join(playerId);

    const gameStateResult = this.gameService.getGameState(playerId, gameCode);
    if (gameStateResult.isErr()) {
      throw new Error(getErrorMessage(gameStateResult.error));
    }
    const game = gameStateResult.value;

    const isReconnect = game.stage === GameStage.ROUND_ROBIN || game.stage === GameStage.POST_ROUND;

    const sanitizedState = this.gameService.getGameStateForPlayer(playerId, gameCode);
    if (sanitizedState.isErr()) {
      throw new Error(getErrorMessage(sanitizedState.error));
    }
    socket.emit('GAME_STATE', sanitizedState.value);

    if (isReconnect) {
      const diceResult = this.gameService.getPlayerDice(playerId, gameCode);
      if (diceResult.isOk() && diceResult.value.length > 0) {
        socket.emit('DICE_ROLLED', { dice: diceResult.value });
      }

      if (game.stage === GameStage.POST_ROUND && game.challengeResults.length > 0) {
        const lastChallengeResult = game.challengeResults[game.challengeResults.length - 1];
        const nextRoundStartsAt = this.roundTimerService.getDeadline(gameCode);
        socket.emit('CHALLENGE_MADE', { ...lastChallengeResult, nextRoundStartsAt });
      }
    } else {
      const remainingDiceResult = this.gameService.getPlayerRemainingDice(playerId, gameCode);
      if (remainingDiceResult.isErr()) {
        throw new Error(getErrorMessage(remainingDiceResult.error));
      }

      const playerMessage: PlayerJoinedPayload = {
        playerId: playerId,
        playerName: playerName,
        remainingDice: remainingDiceResult.value as number
      };
      socket.to(gameCode).emit('PLAYER_JOINED', playerMessage);
    }
  }

  @onDisconnect()
  handleDisconnect(socket: Socket) {
    const playerId: PlayerId = socket.data.playerId!;
    const gameCode: GameCode = socket.data.gameCode!;

    socket.leave(gameCode);
    socket.leave(playerId);

    const gameStateResult = this.gameService.getGameState(playerId, gameCode);
    if (gameStateResult.isErr()) {
      return;
    }
    const game = gameStateResult.value;

    if (game.stage === GameStage.PRE_GAME || game.stage === GameStage.POST_GAME) {
      const result = this.gameService.handleDisconnect(gameCode, playerId);
      if (result.isOk() && result.value.removed) {
        const playerMessage: PlayerLeftPayload = {
          playerId,
          newHostId: result.value.newHostId ?? undefined,
        };
        this.io.to(gameCode).emit('PLAYER_LEFT', playerMessage);
      }
    }
  }

  private handleTurnTimeout(playerId: PlayerId, gameCode: GameCode) {
    const gameStateResult = this.gameService.getGameState(playerId, gameCode);
    if (gameStateResult.isErr()) {
      return;
    }
    const game = gameStateResult.value;

    if (game.stage !== GameStage.ROUND_ROBIN) {
      return;
    }

    const currentPlayer = game.players[game.currentTurnIndex];
    if (!currentPlayer || currentPlayer.id !== playerId) {
      return;
    }

    const forfeitResult = this.gameService.forfeitRound(gameCode, playerId);
    if (forfeitResult.isErr()) {
      return;
    }

    const { loserOut, gameOver, game: updatedGame } = forfeitResult.value;

    let nextRoundStartsAt: Date | null = null;
    if (!gameOver) {
      const delayMs = updatedGame.settings.postRoundDelaySeconds * 1000;
      nextRoundStartsAt = this.roundTimerService.startTimer(gameCode, (gCode) => {
        this.handleAutoStartRound(gCode);
      }, delayMs);
    }

    const forfeitMessage: PlayerForfeitPayload = {
      playerId,
      loserOut,
      gameOver,
      nextRoundStartsAt,
    };
    this.io.to(gameCode).emit('PLAYER_FORFEIT', forfeitMessage);

    if (gameOver) {
      this.turnTimerService.cancelTimer(gameCode);
      this.gameService.setTurnDeadline(gameCode, null);

      const winner = updatedGame.players[0];
      if (winner) {
        const endMessage: GameEndedPayload = { winnerId: winner.id };
        this.io.to(gameCode).emit('GAME_ENDED', endMessage);
      }
    }
  }

  private startTurnTimer(gameCode: GameCode, playerId: PlayerId): Date {
    const gameResult = this.gameService.getGameState(playerId, gameCode);
    const timeoutMs = gameResult.isOk() ? gameResult.value.settings.turnTimeoutSeconds * 1000 : 60_000;

    const deadline = this.turnTimerService.startTimer(playerId, gameCode, (pId, gCode) => {
      this.handleTurnTimeout(pId, gCode);
    }, timeoutMs);
    this.gameService.setTurnDeadline(gameCode, deadline);
    return deadline;
  }

  private handleAutoStartRound(gameCode: GameCode) {
    const gameResult = this.gameService.getGameByCode(gameCode);
    if (gameResult.isErr()) {
      return;
    }
    const game = gameResult.value;

    if (game.stage !== GameStage.POST_ROUND) {
      return;
    }

    const startRoundResult = this.gameService.startRoundAuto(gameCode);
    if (startRoundResult.isErr()) {
      return;
    }

    const { startingPlayerId, dice } = startRoundResult.value;

    const turnDeadline = this.startTurnTimer(gameCode, startingPlayerId);

    const roundStartedMessage: RoundStartedPayload = {
      startingPlayerId,
      turnDeadline,
    };
    this.io.to(gameCode).emit('ROUND_STARTED', roundStartedMessage);

    for (const [playerId, playerDice] of Object.entries(dice)) {
      const diceMessage: DiceRolledPayload = {
        dice: playerDice
      };
      this.io.to(playerId).emit('DICE_ROLLED', diceMessage);
    }
  }

  @event('CLAIM')
  handleClaim(socket: Socket, data: { faceValue: DieFace, quantity: number }): ActionResponse {
    const playerId: PlayerId = socket.data.playerId!;
    const gameCode: GameCode = socket.data.gameCode!;

    ClaimPayloadSchema.parse(data);

    const claimResult = this.gameService.makeClaim(gameCode, playerId, data.faceValue, data.quantity);
    if (claimResult.isErr()) {
      return { ok: false, code: claimResult.error, message: getErrorMessage(claimResult.error) };
    }

    const nextPlayerResult = this.gameService.getCurrentPlayer(gameCode);
    if (nextPlayerResult.isErr()) {
      return { ok: false, code: nextPlayerResult.error, message: getErrorMessage(nextPlayerResult.error) };
    }

    const turnDeadline = this.startTurnTimer(gameCode, nextPlayerResult.value);

    const claimMessage: ClaimMadePayload = {
      playerId: playerId,
      faceValue: data.faceValue,
      quantity: data.quantity,
      nextPlayerId: nextPlayerResult.value,
      turnDeadline,
    };
    this.io.to(gameCode).emit('CLAIM_MADE', claimMessage);

    return { ok: true };
  }

  @event('CHALLENGE')
  handleChallenge(socket: Socket): ActionResponse {
    const playerId: PlayerId = socket.data.playerId!;
    const gameCode: GameCode = socket.data.gameCode!;

    const challengeResult = this.gameService.makeChallenge(gameCode, playerId);
    if (challengeResult.isErr()) {
      return { ok: false, code: challengeResult.error, message: getErrorMessage(challengeResult.error) };
    }

    this.turnTimerService.cancelTimer(gameCode);
    this.gameService.setTurnDeadline(gameCode, null);

    const { gameOver } = challengeResult.value;

    let nextRoundStartsAt: Date | null = null;
    if (!gameOver) {
      const gameResult = this.gameService.getGameByCode(gameCode);
      const delayMs = gameResult.isOk() ? gameResult.value.settings.postRoundDelaySeconds * 1000 : 20_000;
      nextRoundStartsAt = this.roundTimerService.startTimer(gameCode, (gCode) => {
        this.handleAutoStartRound(gCode);
      }, delayMs);
    }

    const challengeMessage: ChallengeMadePayload = {
      ...challengeResult.value,
      nextRoundStartsAt,
    };

    this.io.to(gameCode).emit('CHALLENGE_MADE', challengeMessage);

    return { ok: true };
  }

  @event('START_GAME')
  handleStartGame(socket: Socket): ActionResponse {
    const playerId: PlayerId = socket.data.playerId!;
    const gameCode: GameCode = socket.data.gameCode!;

    const startGameResult = this.gameService.startGame(gameCode, playerId);
    if (startGameResult.isErr()) {
      return { ok: false, code: startGameResult.error, message: getErrorMessage(startGameResult.error) };
    }

    const { startingPlayerId, dice } = startGameResult.value;

    const turnDeadline = this.startTurnTimer(gameCode, startingPlayerId);

    const gameStartedMessage: GameStartedPayload = {
      startingPlayerId: startingPlayerId,
      turnDeadline,
    };
    this.io.to(gameCode).emit('GAME_STARTED', gameStartedMessage);

    for (const [playerId, playerDice] of Object.entries(dice)) {
      const diceMessage: DiceRolledPayload = {
        dice: playerDice
      };
      this.io.to(playerId).emit('DICE_ROLLED', diceMessage);
    }

    return { ok: true };
  }

  @event('START_ROUND')
  handleStartRound(socket: Socket): ActionResponse {
    const playerId: PlayerId = socket.data.playerId!;
    const gameCode: GameCode = socket.data.gameCode!;

    const startRoundResult = this.gameService.startRound(gameCode, playerId);
    if (startRoundResult.isErr()) {
      return { ok: false, code: startRoundResult.error, message: getErrorMessage(startRoundResult.error) };
    }

    const { startingPlayerId, dice } = startRoundResult.value;

    const turnDeadline = this.startTurnTimer(gameCode, startingPlayerId);

    const roundStartedMessage: RoundStartedPayload = {
      startingPlayerId: startingPlayerId,
      turnDeadline,
    };
    this.io.to(gameCode).emit('ROUND_STARTED', roundStartedMessage);

    for (const [playerId, playerDice] of Object.entries(dice)) {
      const diceMessage: DiceRolledPayload = {
        dice: playerDice
      };
      this.io.to(playerId).emit('DICE_ROLLED', diceMessage);
    }

    return { ok: true };
  }

  @event('UPDATE_SETTINGS')
  handleUpdateSettings(socket: Socket, data: Partial<GameSettings>): ActionResponse {
    const playerId: PlayerId = socket.data.playerId!;
    const gameCode: GameCode = socket.data.gameCode!;

    UpdateSettingsPayloadSchema.parse(data);

    const result = this.gameService.updateSettings(gameCode, playerId, data);
    if (result.isErr()) {
      return { ok: false, code: result.error, message: getErrorMessage(result.error) };
    }

    const settingsMessage: SettingsUpdatedPayload = result.value;
    this.io.to(gameCode).emit('SETTINGS_UPDATED', settingsMessage);

    return { ok: true };
  }

  @event('REORDER_PLAYERS')
  handleReorderPlayers(socket: Socket, data: { playerIds: string[] }): ActionResponse {
    const playerId: PlayerId = socket.data.playerId!;
    const gameCode: GameCode = socket.data.gameCode!;

    ReorderPlayersPayloadSchema.parse(data);

    const result = this.gameService.reorderPlayers(gameCode, playerId, data.playerIds as PlayerId[]);
    if (result.isErr()) {
      return { ok: false, code: result.error, message: getErrorMessage(result.error) };
    }

    const reorderMessage: PlayersReorderedPayload = { playerIds: result.value };
    this.io.to(gameCode).emit('PLAYERS_REORDERED', reorderMessage);

    return { ok: true };
  }

  @event('RESET_GAME')
  handleResetGame(socket: Socket): ActionResponse {
    const playerId: PlayerId = socket.data.playerId!;
    const gameCode: GameCode = socket.data.gameCode!;

    const result = this.gameService.resetGame(gameCode, playerId);
    if (result.isErr()) {
      return { ok: false, code: result.error, message: getErrorMessage(result.error) };
    }

    const resetMessage: GameResetPayload = result.value;
    this.io.to(gameCode).emit('GAME_RESET', resetMessage);

    return { ok: true };
  }

  @event('LEAVE_GAME')
  handleLeaveGame(socket: Socket): ActionResponse {
    const playerId: PlayerId = socket.data.playerId!;
    const gameCode: GameCode = socket.data.gameCode!;

    this.turnTimerService.cancelTimer(gameCode);
    this.roundTimerService.cancelTimer(gameCode);

    const result = this.gameService.leaveGame(gameCode, playerId);
    if (result.isErr()) {
      return { ok: false, code: result.error, message: getErrorMessage(result.error) };
    }

    const { newHostId, gameOver, gameDestroyed } = result.value;

    socket.leave(gameCode);
    socket.leave(playerId);

    if (gameDestroyed) {
      return { ok: true };
    }

    const playerLeftMessage: PlayerLeftPayload = {
      playerId,
      newHostId: newHostId ?? undefined,
    };
    this.io.to(gameCode).emit('PLAYER_LEFT', playerLeftMessage);

    if (gameOver) {
      const winner = result.value.game.players[0];
      if (winner) {
        const endMessage: GameEndedPayload = { winnerId: winner.id };
        this.io.to(gameCode).emit('GAME_ENDED', endMessage);
      }
    }

    return { ok: true };
  }
}
