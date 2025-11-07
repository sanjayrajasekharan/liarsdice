import { inject, injectable } from "inversify";
import Store from "./Store";
import { Result, Ok, Err, isErr } from "shared/Result";
import { ChallengeResult, DieFace, GameCode, PlayerId, SocketId } from "shared/types";
import { Claim } from "@game/Claim";
import { Player } from "@game/Player";

@injectable()
export default class GameService {
    constructor(@inject(Store) private store: Store) { }

    makeClaim(gameCode: GameCode, playerId: PlayerId, faceValue: DieFace, quantity: number): Result<void> {
        const gameResult = this.store.getGame(gameCode);
        if (isErr(gameResult)) {
            return Err(gameResult.error);
        }
        const game = gameResult.value;
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
        const challengeResult = game.challenge(playerId);
        if (isErr(challengeResult)) {
            return Err(challengeResult.error);
        }
        return Ok(challengeResult.value);
    }

    startRound(gameCode: GameCode, initiator: PlayerId): Result<{startingPlayerId:PlayerId, dice: Record<PlayerId, DieFace[]>}> {
        const gameResult = this.store.getGame(gameCode);
        if (isErr(gameResult)) {
            return Err(gameResult.error);
        }
        const game = gameResult.value;
        const startRoundResult = game.startRound(initiator);
        if (isErr(startRoundResult)) {
            return Err(startRoundResult.error);
        }
        
        const dice = Object.fromEntries(
            Array.from(game.getPlayers().values()).map(player => [player.getId(), player.getDice()])
        ) as Record<PlayerId, DieFace[]>;
        return Ok({ startingPlayerId: startRoundResult.value, dice });
    }

    startGame(gameCode: GameCode, initiator: PlayerId): Result<{startingPlayerId:PlayerId, dice: Record<PlayerId, DieFace[]>}> {
        const gameResult = this.store.getGame(gameCode);
        if (isErr(gameResult)) {
            return Err(gameResult.error);
        }
        const game = gameResult.value;
        const startGameResult = game.startGame(initiator);
        if (isErr(startGameResult)) {
            return Err(startGameResult.error);
        }
        
        const dice = Object.fromEntries(
            Array.from(game.getPlayers().values()).map(player => [player.getId(), player.getDice()])
        ) as Record<PlayerId, DieFace[]>;
        return Ok({ startingPlayerId: startGameResult.value, dice });
    }
}