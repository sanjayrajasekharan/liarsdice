import { ClaimPayloadSchema, ActionResponse, ClientToServerEvents } from "shared/client-events.js";
import { ServerToClientEvents, PlayerJoinedPayload, PlayerLeftPayload, ClaimMadePayload, ChallengeMadePayload, GameStartedPayload, RoundStartedPayload, DiceRolledPayload } from "shared/server-events.js";
import { onConnect, socketController, event, onDisconnect } from "@sockets/socket-utils/main";
import { Socket as BaseSocket, Server as BaseServer } from "socket.io";
import { inject } from "inversify";
import GameService from "@app/GameService.js";
import { DieFace, GameCode, PlayerId } from "shared/domain.js";
import { getErrorMessage } from "shared/errors.js";
import { authMiddleware } from "@sockets/middleware/authMiddleware.js";

type Socket = BaseSocket<ClientToServerEvents, ServerToClientEvents>;
type Server = BaseServer<ClientToServerEvents, ServerToClientEvents>;

@socketController(undefined, authMiddleware)
export class GameController {
    constructor(@inject(GameService) private gameService: GameService, @inject(BaseServer) private io: Server) { }

    @onConnect()
    handleConnect(socket: Socket) {
        const playerId: PlayerId = socket.data.playerId!;
        const gameCode: GameCode = socket.data.gameCode!;
        const playerName: string = socket.data.playerName!;

        socket.join(gameCode);
        socket.join(playerId);

        const gameStateResult = this.gameService.getGameState(playerId, gameCode);

        if (gameStateResult.isErr()) {
            throw new Error(getErrorMessage(gameStateResult.error));
        }
        const gameState = gameStateResult.value;
        socket.emit('GAME_STATE', gameState);

        

        const playerMessage: PlayerJoinedPayload = {
            playerId: playerId,
            playerName: playerName
        };
        socket.to(gameCode).emit('PLAYER_JOINED', playerMessage);
    }

    @onDisconnect()
    handleDisconnect(socket: Socket) {
        const playerId: PlayerId = socket.data.playerId!;
        const gameCode: GameCode = socket.data.gameCode!;

        socket.leave(gameCode);
        socket.leave(playerId);
        const playerMessage: PlayerLeftPayload = {
            playerId: playerId
        };

        this.gameService.handleDisconnect(gameCode, playerId);
        this.io.to(gameCode).emit('PLAYER_LEFT', playerMessage);
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

        const claimMessage: ClaimMadePayload = {
            playerId: playerId,
            faceValue: data.faceValue,
            quantity: data.quantity,
            nextPlayerId: nextPlayerResult.value
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

        const challengeMessage: ChallengeMadePayload = {
            ...challengeResult.value
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
        const gameStartedMessage: GameStartedPayload = {
            startingPlayerId: startingPlayerId
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
        const roundStartedMessage: RoundStartedPayload = {
            startingPlayerId: startingPlayerId
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
}
