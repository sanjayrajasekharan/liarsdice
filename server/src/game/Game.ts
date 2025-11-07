// class that manages the game state and logic
import { Player } from './Player.js';
import { Claim } from './Claim.js';
import { count, generate } from 'random-words';
import { Result, Ok, Err } from 'shared/Result.js';
import { ErrorCode } from 'shared/errors.js';
import { PlayerId, GameCode, GameStage, ChallengeResult } from 'shared/types.js';
import { v4 as uuidv4 } from 'uuid';

export class Game {
    private static readonly MAX_PLAYERS = 6; // change to reed from shared config in future

    private constructor(
        private gameCode: GameCode,
        private hostId: PlayerId,
        private hostName: string,
        private players: Map<PlayerId, Player> = new Map(),
        private order: PlayerId[] = [],
        private turnIndex: number = 0,
        private claims: Claim[] = [],
        private stage: GameStage = GameStage.PRE_GAME
    ) { 
        const hostPlayer = new Player(hostId, hostName, this);
        this.players.set(hostId, hostPlayer);
        this.order.push(hostId);
    }


    public createPlayer(playerName: string): Result<{ playerId: PlayerId; player: Player }> {
        if (this.players.size >= Game.MAX_PLAYERS) {
            return Err(ErrorCode.GAME_FULL);
        }
        if (this.stage !== GameStage.PRE_GAME) {
            return Err(ErrorCode.GAME_IN_PROGRESS);
        }

        const playerId = Game.generatePlayerId();
        const player = new Player(playerId, playerName, this);
        this.players.set(player.getId(), player);
        this.order.push(player.getId());
        return Ok({ playerId, player });
    }

    validateTurn(playerId: PlayerId): Result<void> {
        if (this.stage !== GameStage.ROUND_ROBIN) {
            return Err(ErrorCode.ROUND_NOT_ACTIVE);
        }
        const currentPlayerId = this.order[this.turnIndex];
        if (currentPlayerId !== playerId) {
            return Err(ErrorCode.OUT_OF_TURN);
        }
        return Ok(undefined);
    }

    addClaim(claim: Claim): Result<void> {
        const turnValidation = this.validateTurn(claim.getPlayerId());
        if (!turnValidation.ok) {
            return turnValidation;
        }
        const lastClaim = this.claims[this.claims.length - 1];
        // First claim of the round is always valid
        if (lastClaim && !claim.validateAgainst(lastClaim)) {
            return Err(ErrorCode.INVALID_CLAIM,
                // #TODO replace these string literals with templates
                `Claim ${claim.getQuantity()} of ${claim.getFaceValue()} is not valid against ${lastClaim.getQuantity()} of ${lastClaim.getFaceValue()}`
            );
        }
        this.claims.push(claim);
        this.turnIndex = (this.turnIndex + 1) % this.order.length;
        return Ok(undefined);
    }

    challenge(playerId: PlayerId): Result<ChallengeResult> {
        const turnValidation = this.validateTurn(playerId);
        if (!turnValidation.ok) {
            return turnValidation;
        }

        if (this.claims.length === 0) {
            return Err(ErrorCode.INVALID_CHALLENGE, 'No claim to challenge');
        }

        const lastClaim = this.claims[this.claims.length - 1];
        const [quantity, faceValue, prevPlayerId] = [lastClaim.getQuantity(), lastClaim.getFaceValue(), lastClaim.getPlayerId()];

        const winnerId = this.countDice(faceValue) < quantity ? playerId : prevPlayerId;
        const loserId = winnerId === playerId ? prevPlayerId : playerId;

        this.players.get(loserId)?.loseDie();
        this.turnIndex = this.order.indexOf(winnerId);

        const loserOut = this.players.get(loserId)?.getNumberOfDice() === 0;

        if (loserOut) {
            this.order = this.order.filter(id => id !== loserId);
        }


        return Ok({ winnerId, loserId, loserOut });
    }

    private countDice(faceValue: number): number {
        return Array.from(this.players.values()).reduce((total, player) => {
            return total + player.getDiceCount(faceValue);
        }, 0);
    }

    startRound(initiator: PlayerId): Result<PlayerId> {
        if (this.stage !== GameStage.PRE_GAME && this.stage !== GameStage.POST_ROUND) {
            return Err(ErrorCode.INVALID_GAME_STATE);
        }

        this.rollAllDice();
        this.claims = [];

        this.stage = GameStage.ROUND_ROBIN;

        return Ok(this.order[this.turnIndex]);
    }

    startGame(initiator: PlayerId): Result<PlayerId> {
        if (initiator !== this.hostId) {
            return Err(ErrorCode.UNAUTHORIZED);
        }
        if (this.stage !== GameStage.PRE_GAME) {
            return Err(ErrorCode.GAME_IN_PROGRESS);
        }
        this.turnIndex = Math.floor(Math.random() * this.players.size);

        this.rollAllDice();
        this.claims = [];

        this.stage = GameStage.ROUND_ROBIN;

        return Ok(this.order[this.turnIndex]);
    }

    private rollAllDice(): void {
        Array.from(this.players.values()).forEach(player => player.rollDice());
    }

    // Getters

    getGameCode(): GameCode {
        return this.gameCode;
    }

    getHostId(): PlayerId {
        return this.hostId;
    }

    getPlayers(): Map<PlayerId, Player> {
        return this.players;
    }

    getPlayer(playerId: PlayerId): Result<Player> {
        const player = this.players.get(playerId);
        if (!player) {
            return Err(ErrorCode.PLAYER_NOT_FOUND);
        }
        return Ok(player);
    }

    getOrder(): PlayerId[] {
        return this.order;
    }

    getTurnIndex(): number {
        return this.turnIndex;
    }

    getClaims(): Claim[] {
        return this.claims;
    }

    toJSON() {
        return {
            gameCode: this.gameCode,
            host: this.players.get(this.hostId)?.getName(),
            players: Array.from(this.order).map((playerId: PlayerId) => (
                { name: this.players.get(playerId)?.getName(), 
                  remainingDice: this.players.get(playerId)?.getNumberOfDice() 
                })),
            stage: this.stage,
        };
    }

    // Static

    public static generateGameCode(): GameCode {
        let gameCode: GameCode;
        gameCode = generate({
            exactly: 3,
            maxLength: 5,
            minLength: 4,
            join: "-",
            seed: Date.now().toString(),
        });

        return gameCode;
    }

    static generatePlayerId = uuidv4;

    public static createGame(gameCode: GameCode, hostName: string): Game {
        return new Game(gameCode, this.generatePlayerId(), hostName);
    }

}