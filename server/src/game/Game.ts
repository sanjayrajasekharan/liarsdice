import { Player } from './Player.js';
import { Claim } from './Claim.js';
import { generate } from 'random-words';
import { Result, ok, err } from 'neverthrow';
import { ErrorCode } from 'shared/errors.js';
import { PlayerId, GameCode, GameStage, ChallengeResult, GameState } from 'shared/domain.js';
import { v4 as uuidv4 } from 'uuid';

export class Game {
    private static readonly MAX_PLAYERS = 6;

    private constructor(
        private gameCode: GameCode,
        private hostId: PlayerId,
        private players: Player[] = [],
        private currentTurnIndex: number = 0,
        private claims: Claim[] = [],
        private stage: GameStage = GameStage.PRE_GAME,
        private createdAt: Date = new Date(),
        private lastActivityAt: Date = new Date()
    ) {}

    public createPlayer(playerName: string): Result<{ playerId: PlayerId; player: Player }, ErrorCode> {
        if (this.players.length >= Game.MAX_PLAYERS) {
            return err(ErrorCode.GAME_FULL);
        }
        if (this.stage !== GameStage.PRE_GAME) {
            return err(ErrorCode.GAME_IN_PROGRESS);
        }

        const playerId = Game.generatePlayerId();
        const player = new Player(playerId, playerName);
        this.players.push(player);
        return ok({ playerId, player });
    }

    validateTurn(playerId: PlayerId): Result<void, ErrorCode> {
        if (this.stage !== GameStage.ROUND_ROBIN) {
            return err(ErrorCode.ROUND_NOT_ACTIVE);
        }
        const currentPlayer = this.players[this.currentTurnIndex];
        if (!currentPlayer || currentPlayer.getId() !== playerId) {
            return err(ErrorCode.OUT_OF_TURN);
        }
        return ok(undefined);
    }

    addClaim(claim: Claim): Result<void, ErrorCode> {
        const turnValidation = this.validateTurn(claim.getPlayerId());
        if (turnValidation.isErr()) {
            return err(turnValidation.error);
        }
        const lastClaim = this.claims[this.claims.length - 1];
        if (lastClaim && !claim.validateAgainst(lastClaim)) {
            return err(ErrorCode.INVALID_CLAIM);
        }
        this.claims.push(claim);
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
        return ok(undefined);
    }

    challenge(playerId: PlayerId): Result<ChallengeResult, ErrorCode> {
        const turnValidation = this.validateTurn(playerId);
        if (turnValidation.isErr()) {
            return err(turnValidation.error);
        }

        if (this.claims.length === 0) {
            return err(ErrorCode.INVALID_CHALLENGE);
        }

        const lastClaim = this.claims[this.claims.length - 1];
        const [quantity, faceValue, claimerId] = [lastClaim.getQuantity(), lastClaim.getFaceValue(), lastClaim.getPlayerId()];

        const actualTotal = this.countDice(faceValue);
        const playerCounts = this.players.map(player => ({
            playerId: player.getId(),
            playerName: player.getName(),
            count: player.getDiceCount(faceValue),
        }));

        const winnerId = actualTotal < quantity ? playerId : claimerId;
        const loserId = winnerId === playerId ? claimerId : playerId;

        const loser = this.findPlayer(loserId);
        loser?.loseDie();

        const winnerIndex = this.players.findIndex(p => p.getId() === winnerId);
        this.currentTurnIndex = winnerIndex >= 0 ? winnerIndex : 0;

        const loserOut = loser?.getNumberOfDice() === 0;

        if (loserOut) {
            const loserIndex = this.players.findIndex(p => p.getId() === loserId);
            if (loserIndex >= 0) {
                this.players.splice(loserIndex, 1);
                if (this.currentTurnIndex >= this.players.length) {
                    this.currentTurnIndex = 0;
                } else if (loserIndex < this.currentTurnIndex) {
                    this.currentTurnIndex--;
                }
            }
        }

        this.stage = GameStage.POST_ROUND;
        const gameOver = this.players.length === 1;
        if (gameOver) {
            this.stage = GameStage.POST_GAME;
        }

        return ok({
            challengerId: playerId,
            claimerId,
            claimedQuantity: quantity,
            claimedFace: faceValue,
            actualTotal,
            playerCounts,
            winnerId,
            loserId,
            loserOut,
            gameOver,
        });
    }

    private countDice(faceValue: number): number {
        return this.players.reduce((total, player) => {
            return total + player.getDiceCount(faceValue);
        }, 0);
    }

    private findPlayer(playerId: PlayerId): Player | undefined {
        return this.players.find(p => p.getId() === playerId);
    }

    private findPlayerIndex(playerId: PlayerId): number {
        return this.players.findIndex(p => p.getId() === playerId);
    }

    startRound(initiator: PlayerId): Result<PlayerId, ErrorCode> {
        if (this.stage !== GameStage.PRE_GAME && this.stage !== GameStage.POST_ROUND) {
            return err(ErrorCode.INVALID_GAME_STATE);
        }

        this.rollAllDice();
        this.claims = [];
        this.stage = GameStage.ROUND_ROBIN;

        const currentPlayer = this.players[this.currentTurnIndex];
        return ok(currentPlayer?.getId() as PlayerId);
    }

    startGame(initiator: PlayerId): Result<PlayerId, ErrorCode> {
        if (initiator !== this.hostId) {
            return err(ErrorCode.UNAUTHORIZED);
        }
        if (this.stage !== GameStage.PRE_GAME) {
            return err(ErrorCode.GAME_IN_PROGRESS);
        }
        if (this.players.length < 2) {
            return err(ErrorCode.NOT_ENOUGH_PLAYERS);
        }

        this.currentTurnIndex = Math.floor(Math.random() * this.players.length);
        this.rollAllDice();
        this.claims = [];
        this.stage = GameStage.ROUND_ROBIN;

        const currentPlayer = this.players[this.currentTurnIndex];
        return ok(currentPlayer?.getId() as PlayerId);
    }

    private rollAllDice(): void {
        this.players.forEach(player => player.rollDice());
    }

    // Getters

    getGameCode(): GameCode {
        return this.gameCode;
    }

    getHostId(): PlayerId {
        return this.hostId;
    }

    getPlayers(): Player[] {
        return this.players;
    }

    getPlayer(playerId: PlayerId): Result<Player, ErrorCode> {
        const player = this.findPlayer(playerId);
        if (!player) {
            return err(ErrorCode.PLAYER_NOT_FOUND);
        }
        return ok(player);
    }

    removePlayer(playerId: PlayerId): Result<void, ErrorCode> {
        const index = this.findPlayerIndex(playerId);
        if (index < 0) {
            return err(ErrorCode.PLAYER_NOT_FOUND);
        }
        this.players.splice(index, 1);
        if (this.currentTurnIndex >= this.players.length) {
            this.currentTurnIndex = 0;
        }
        return ok(undefined);
    }

    getStage(): GameStage {
        return this.stage;
    }

    getCurrentTurnIndex(): number {
        return this.currentTurnIndex;
    }

    getCurrentPlayerId(): PlayerId | null {
        const player = this.players[this.currentTurnIndex];
        return player ? player.getId() as PlayerId : null;
    }

    getClaims(): Claim[] {
        return this.claims;
    }

    toJSON(): GameState {
        return {
            gameCode: this.gameCode,
            hostId: this.hostId,
            players: this.players.map(player => ({
                id: player.getId(),
                name: player.getName(),
                remainingDice: player.getNumberOfDice()
            })),
            currentTurnIndex: this.currentTurnIndex,
            stage: this.stage,
        };
    }

    // Activity tracking

    public updateActivity(): void {
        this.lastActivityAt = new Date();
    }

    public getLastActivityAt(): Date {
        return this.lastActivityAt;
    }

    public getCreatedAt(): Date {
        return this.createdAt;
    }

    public getInactivityMs(): number {
        return Date.now() - this.lastActivityAt.getTime();
    }

    // Static

    public static generateGameCode(): GameCode {
        return generate({
            exactly: 3,
            maxLength: 5,
            minLength: 4,
            join: "-",
            seed: Date.now().toString(),
        }) as GameCode;
    }

    static generatePlayerId = (): PlayerId => uuidv4() as PlayerId;

    public static createGame(gameCode: GameCode, hostName: string): Game {
        const hostId = this.generatePlayerId();
        const hostPlayer = new Player(hostId, hostName);
        const game = new Game(gameCode, hostId, [hostPlayer]);
        return game;
    }
}
