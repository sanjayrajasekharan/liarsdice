import { inject, injectable } from "inversify";
import Store from "./Store";
import { Result, Ok, Err, isErr } from "../../../shared/Result";
import { ErrorCode } from "../../../shared/errors";
import { ChallengeResult, DieFace, GameCode, PlayerId, SocketId } from "../../../shared/types";
import { Claim } from "../game/Claim";

@injectable()
export default class GameService {
    constructor(@inject("Store") private store: Store) { }

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

    startRound(gameCode: GameCode, startingPlayerId: PlayerId): Result<void> {
        const gameResult = this.store.getGame(gameCode);
        if (isErr(gameResult)) {
            return Err(gameResult.error);
        }
        const game = gameResult.value;
        if (game.getHostId() !== startingPlayerId) {
            return Err(ErrorCode.UNAUTHORIZED);
        }
        return game.startRound(startingPlayerId);
    }

    startGame = this.startRound;
}