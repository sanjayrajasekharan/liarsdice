import { inject, injectable } from "inversify";
import Store from "./Store";
import { Result, ok, err } from "neverthrow";
import { ChallengeResult, DieFace, GameCode, PlayerId, GameStage, GameState } from "shared/domain.js";
import { Claim } from "@game/Claim";
import { Player } from "@game/Player";
import { ErrorCode } from "shared/errors.js";

@injectable()
export default class GameService {
    constructor(@inject(Store) private store: Store) { }

    getCurrentPlayer(gameCode: GameCode): Result<PlayerId, ErrorCode> {
        const gameResult = this.store.getGame(gameCode);
        if (gameResult.isErr()) {
            return err(gameResult.error);
        }
        const game = gameResult.value;
        if (game.getStage() !== GameStage.ROUND_ROBIN) return err(ErrorCode.ROUND_NOT_ACTIVE);

        const currentPlayerId = game.getCurrentPlayerId();
        if (!currentPlayerId) return err(ErrorCode.PLAYER_NOT_FOUND);
        return ok(currentPlayerId);
    }

    makeClaim(gameCode: GameCode, playerId: PlayerId, faceValue: DieFace, quantity: number): Result<void, ErrorCode> {
        const gameResult = this.store.getGame(gameCode);
        if (gameResult.isErr()) {
            return err(gameResult.error);
        }
        const game = gameResult.value;
        game.updateActivity();
        
        const claim = new Claim(playerId, quantity, faceValue);
        const claimResult = game.addClaim(claim);

        if (claimResult.isErr()) {
            return err(claimResult.error);
        }
        return ok(undefined);

    }

    makeChallenge(gameCode: GameCode, playerId: PlayerId): Result<ChallengeResult, ErrorCode> {
        const gameResult = this.store.getGame(gameCode);
        if (gameResult.isErr()) {
            return err(gameResult.error);
        }
        const game = gameResult.value;
        game.updateActivity();
        
        const challengeResult = game.challenge(playerId);
        if (challengeResult.isErr()) {
            return err(challengeResult.error);
        }
        return ok(challengeResult.value);
    }

    startRound(gameCode: GameCode, initiator: PlayerId): Result<{ startingPlayerId: PlayerId, dice: Record<PlayerId, DieFace[]> }, ErrorCode> {
        const gameResult = this.store.getGame(gameCode);
        if (gameResult.isErr()) {
            return err(gameResult.error);
        }
        const game = gameResult.value;
        game.updateActivity();
        
        const startRoundResult = game.startRound(initiator);
        if (startRoundResult.isErr()) {
            return err(startRoundResult.error);
        }

        const dice = Object.fromEntries(
            game.getPlayers().map(player => [player.getId(), player.getDice()])
        ) as Record<PlayerId, DieFace[]>;
        return ok({ startingPlayerId: startRoundResult.value, dice });
    }

    startGame(gameCode: GameCode, initiator: PlayerId): Result<{ startingPlayerId: PlayerId, dice: Record<PlayerId, DieFace[]> }, ErrorCode> {
        const gameResult = this.store.getGame(gameCode);
        if (gameResult.isErr()) {
            return err(gameResult.error);
        }
        const game = gameResult.value;
        game.updateActivity();
        
        const startGameResult = game.startGame(initiator);
        if (startGameResult.isErr()) {
            return err(startGameResult.error);
        }

        const dice = Object.fromEntries(
            game.getPlayers().map(player => [player.getId(), player.getDice()])
        ) as Record<PlayerId, DieFace[]>;
        return ok({ startingPlayerId: startGameResult.value, dice });
    }

    handleDisconnect(gameCode: GameCode, playerId: PlayerId): Result<{ gameShutdown: boolean }, ErrorCode> {
        const gameResult = this.store.getGame(gameCode);
        if (gameResult.isErr()) {
            return err(gameResult.error);
        }
        const game = gameResult.value;
        game.updateActivity();

        if (game.getStage() === GameStage.PRE_GAME || game.getStage() === GameStage.POST_GAME) {
            const removePlayerResult = game.removePlayer(playerId);
            if (removePlayerResult.isErr()) {
                return err(removePlayerResult.error);
            }

            if (game.getStage() === GameStage.PRE_GAME && game.getPlayers().length === 0) {
                this.store.removeGame(gameCode);
                return ok({ gameShutdown: true });
            }
        }
        
        return ok({ gameShutdown: false });
    }

    getGameState(playerId: PlayerId, gameCode: GameCode): Result<GameState, ErrorCode> {
        const gameResult = this.store.getGame(gameCode);
        if (gameResult.isErr()) {
            return err(gameResult.error);
        }
        const game = gameResult.value;
        const playerExists = game.getPlayers().some(p => p.getId() === playerId);
        if (!playerExists) {
            return err(ErrorCode.PLAYER_NOT_FOUND);
        }
        return ok(game.toJSON());
    }
}
