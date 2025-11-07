import { Action } from "shared/actions";
import { StateChange } from "shared/states";
import { onConnect, socketController, event, onDisconnect } from "@sockets/socket-utils/main";
import { Socket, Server as SocketServer } from "socket.io";
import { inject } from "inversify";
import GameService from "@app/GameService";
import {
    ChallengeMadeMessage, ClaimMadeMessage, DiceRolledMessage, DieFace, GameCode, GameStartedMessage, PlayerId, PlayerLeftMessage, RoundStartedMessage, ServerMessage
} from "shared/types";
import { isErr } from "shared/Result";
import { errorMessage } from "shared/errors";
import { authMiddleware } from "@sockets/middleware/authMiddleware";

@socketController(undefined, authMiddleware)
export class GameController {
    constructor(@inject(GameService) private gameService: GameService, @inject(SocketServer) private io: SocketServer) { }

    // TODO: have to send game state on connect
    // TODO: have to deny connections for games that don't exist
    @onConnect()
    handleConnect(socket: Socket) {
        const playerId: PlayerId = socket.data.playerId!;
        const gameCode: GameCode = socket.data.gameCode!;
        const playerName: string = socket.data.playerName!;

        socket.join(gameCode);
        socket.join(playerId);

        const playerMessage: ServerMessage = {
            type: StateChange.PLAYER_JOINED,
            playerId: playerId,
            playerName: playerName
        };

        const gameStateResult = this.gameService.getGameState(gameCode);
        if (isErr(gameStateResult)) {
            throw new Error(errorMessage(gameStateResult.error));
        }
        const gameState = gameStateResult.value;
        this.io.to(playerId).emit(StateChange.GAME_STATE, gameState);
        this.io.to(gameCode).emit(StateChange.PLAYER_JOINED, playerMessage);
    }

    @onDisconnect()
    handleDisconnect(socket: Socket) {
        const playerId: PlayerId = socket.data.playerId!;
        const gameCode: GameCode = socket.data.gameCode!;

        socket.leave(gameCode);
        socket.leave(playerId);
        const playerMessage: PlayerLeftMessage = {
            type: StateChange.PLAYER_LEFT,
            playerId: playerId
        };

        this.gameService.handleDisconnect(gameCode, playerId);
        this.io.to(gameCode).emit(StateChange.PLAYER_LEFT, playerMessage);
    }

    @event(Action.CLAIM)
    handleClaim(socket: Socket, data: { faceValue: DieFace, quantity: number }) {
        const playerId: PlayerId = socket.data.playerId!;
        const gameCode: GameCode = socket.data.gameCode!;

        const claimResult = this.gameService.makeClaim(gameCode, playerId, data.faceValue, data.quantity);
        if (isErr(claimResult)) {
            throw new Error(errorMessage(claimResult.error));
        }

        const nextPlayerResult = this.gameService.getCurrentPlayer(gameCode);
        if (isErr(nextPlayerResult)) {
            throw new Error(errorMessage(nextPlayerResult.error));
        }
        const claimMessage: ClaimMadeMessage = {
            type: StateChange.CLAIM_MADE,
            playerId: playerId,
            faceValue: data.faceValue,
            quantity: data.quantity,
            nextPlayerId: nextPlayerResult.value

        };
        this.io.to(gameCode).emit(StateChange.CLAIM_MADE, claimMessage);
    }

    @event(Action.CHALLENGE)
    handleChallenge(socket: Socket) {
        const playerId: PlayerId = socket.data.playerId!;
        const gameCode: GameCode = socket.data.gameCode!;

        const challengeResult = this.gameService.makeChallenge(gameCode, playerId);
        if (isErr(challengeResult)) {
            throw new Error(errorMessage(challengeResult.error));
        }

        const challengeMessage: ChallengeMadeMessage = {
            type: StateChange.CHALLENGE_MADE,
            ...challengeResult.value
        };

        this.io.to(gameCode).emit(StateChange.CHALLENGE_MADE, challengeMessage);
    }

    // TODO: handle errors better
    @event(Action.START_GAME)
    handleStartGame(socket: Socket) {
        const playerId: PlayerId = socket.data.playerId!;
        const gameCode: GameCode = socket.data.gameCode!;

        const startGameResult = this.gameService.startGame(gameCode, playerId);
        if (isErr(startGameResult)) {
            throw new Error(errorMessage(startGameResult.error));
        }
        const { startingPlayerId, dice } = startGameResult.value;
        const gameStartedMessage: GameStartedMessage = {
            type: StateChange.GAME_STARTED,
            startingPlayerId: startingPlayerId
        };
        this.io.to(gameCode).emit(StateChange.GAME_STARTED, gameStartedMessage);
        for (const [playerId, playerDice] of Object.entries(dice)) {
            const diceMessage: DiceRolledMessage = {
                type: StateChange.DICE_ROLLED,
                dice: playerDice
            };
            this.io.to(playerId).emit(StateChange.DICE_ROLLED, diceMessage);
        }
    }

    @event(Action.START_ROUND)
    handleStartRound(socket: Socket) {
        const playerId: PlayerId = socket.data.playerId!;
        const gameCode: GameCode = socket.data.gameCode!;

        const startRoundResult = this.gameService.startRound(gameCode, playerId);
        if (isErr(startRoundResult)) {
            throw new Error(errorMessage(startRoundResult.error));
        }
        const { startingPlayerId, dice } = startRoundResult.value;

        const message: RoundStartedMessage = {
            type: StateChange.ROUND_STARTED,
            startingPlayerId: startingPlayerId
        }
        this.io.to(gameCode).emit(StateChange.ROUND_STARTED, message);

        for (const [playerId, playerDice] of Object.entries(dice)) {
            let diceMessage: DiceRolledMessage = {
                type: StateChange.DICE_ROLLED,
                dice: playerDice
            };

            this.io.to(playerId).emit(StateChange.DICE_ROLLED, diceMessage);
        }
    }
}