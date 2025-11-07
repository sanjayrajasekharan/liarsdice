import { inject, injectable } from "inversify";
import Store from "./Store";
import { Result, Ok, Err, isErr } from "shared/Result";
import { ChallengeResult, DieFace, GameCode, PlayerId, GameStage, GameState } from "shared/types";
import { Claim } from "@game/Claim";
import { Player } from "@game/Player";
import { ErrorCode } from "shared/errors";

@injectable()
export default class GameService {
    constructor(@inject(Store) private store: Store) { }

    getCurrentPlayer(gameCode: GameCode): Result<PlayerId> {
        const gameResult = this.store.getGame(gameCode);
        if (isErr(gameResult)) {
            return Err(gameResult.error);
        }
        const game = gameResult.value;
        if (game.getStage() !== GameStage.ROUND_ROBIN) return Err(ErrorCode.ROUND_NOT_ACTIVE);

        return Ok(game.getOrder()[game.getTurnIndex()]);
    }

    makeClaim(gameCode: GameCode, playerId: PlayerId, faceValue: DieFace, quantity: number): Result<void> {
        const gameResult = this.store.getGame(gameCode);
        if (isErr(gameResult)) {
            return Err(gameResult.error);
        }
        const game = gameResult.value;
        game.updateActivity();
        
        const claim = new Claim(playerId, quantity, faceValue);
        const claimResult = game.addClaim(claim);

        if (isErr(claimResult)) {
            return Err(claimResult.error);
        }
        return Ok(undefined);

    }

    makeChallenge(gameCode: GameCode, playerId: PlayerId): Result<ChallengeResult> {
        const gameResult = this.store.getGame(gameCode);
        if (isErr(gameResult)) {
            return Err(gameResult.error);
        }
        const game = gameResult.value;
        game.updateActivity();
        
        const challengeResult = game.challenge(playerId);
        if (isErr(challengeResult)) {
            return Err(challengeResult.error);
        }
        return Ok(challengeResult.value);
    }

    startRound(gameCode: GameCode, initiator: PlayerId): Result<{ startingPlayerId: PlayerId, dice: Record<PlayerId, DieFace[]> }> {
        const gameResult = this.store.getGame(gameCode);
        if (isErr(gameResult)) {
            return Err(gameResult.error);
        }
        const game = gameResult.value;
        game.updateActivity();
        
        const startRoundResult = game.startRound(initiator);
        if (isErr(startRoundResult)) {
            return Err(startRoundResult.error);
        }

        const dice = Object.fromEntries(
            Array.from(game.getPlayers().values()).map(player => [player.getId(), player.getDice()])
        ) as Record<PlayerId, DieFace[]>;
        return Ok({ startingPlayerId: startRoundResult.value, dice });
    }

    startGame(gameCode: GameCode, initiator: PlayerId): Result<{ startingPlayerId: PlayerId, dice: Record<PlayerId, DieFace[]> }> {
        const gameResult = this.store.getGame(gameCode);
        if (isErr(gameResult)) {
            return Err(gameResult.error);
        }
        const game = gameResult.value;
        game.updateActivity();
        
        const startGameResult = game.startGame(initiator);
        if (isErr(startGameResult)) {
            return Err(startGameResult.error);
        }

        const dice = Object.fromEntries(
            Array.from(game.getPlayers().values()).map(player => [player.getId(), player.getDice()])
        ) as Record<PlayerId, DieFace[]>;
        return Ok({ startingPlayerId: startGameResult.value, dice });
    }

    handleDisconnect(gameCode: GameCode, playerId: PlayerId): Result<void> {
        const gameResult = this.store.getGame(gameCode);
        if (isErr(gameResult)) {
            return Err(gameResult.error);
        }
        const game = gameResult.value;
        game.updateActivity();

        if (game.getStage() === GameStage.PRE_GAME) {
            const removePlayerResult = game.removePlayer(playerId);
            if (isErr(removePlayerResult)) {
                return Err(removePlayerResult.error);
            }
        }
        
        // If game is now empty, it will be cleaned up by passive cleanup or periodic sweep
        return Ok(undefined);
    }

    getGameState(gameCode: GameCode): Result<GameState> {
        const gameResult = this.store.getGame(gameCode);
        if (isErr(gameResult)) {
            return Err(gameResult.error);
        }
        const game = gameResult.value;
        return Ok(game.toJSON());
    }
}