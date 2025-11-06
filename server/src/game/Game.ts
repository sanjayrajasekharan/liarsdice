// class that manages the game state and logic
import { Player } from './Player';
import { Claim } from './Claim';
import { count, generate } from 'random-words';
import { Result, Ok, Err} from '../../../shared/Result';
import { ErrorCode } from '../../../shared/errors';
import { PlayerId, GameCode, GameStage } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class Game {
    private static readonly MAX_PLAYERS = 6; // change to reed from shared config in future
    private static games: Map<GameCode, Game> = new Map();

    private constructor(
        private gameCode: GameCode,
        private hostId: PlayerId, 
        private players: Map<PlayerId, Player> = new Map(), 
        private order: PlayerId[] = [],
        private turnIndex: number = 0,
        private claims: Claim[] = [],
        private stage: GameStage = GameStage.PRE_GAME
    ) {}

    public createPlayer(playerName: string): Result<{ playerId: PlayerId; player: Player }> {
        if (this.players.size >= Game.MAX_PLAYERS) {
            return Err(ErrorCode.GAME_FULL);
        }
        if (this.stage !== GameStage.PRE_GAME) {
            return Err(ErrorCode.GAME_IN_PROGRESS);
        }

        const playerId = uuidv4();
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

    challenge(playerId: PlayerId): Result<{ winnerId: PlayerId; loserId: PlayerId; loserOut: boolean }> {
        const turnValidation = this.validateTurn(playerId);
        if (!turnValidation.ok) {
            return turnValidation;
        }

        const lastClaim = this.claims[this.claims.length - 1];
        const [quantity, faceValue, prevPlayerId] = [lastClaim.getQuantity(), lastClaim.getFaceValue(), lastClaim.getPlayerId()];

        const winnerId = this.countDice(faceValue) < quantity ? playerId : prevPlayerId;
        const loserId = winnerId === playerId ? prevPlayerId : playerId;
        
        this.players.get(loserId)?.loseDie();
        this.turnIndex = this.order.indexOf(winnerId);

        const loserOut = this.players.get(loserId)?.getNumberOfDice() === 0;

        return Ok({ winnerId, loserId, loserOut });
    }

    private countDice(faceValue: number): number {
        return Array.from(this.players.values()).reduce((total, player) => {
            return total + player.getDiceCount(faceValue);
        }, 0);
    }

    startRound(startingPlayerId: PlayerId): Result<void> {
        if (this.stage !== GameStage.PRE_GAME && this.stage !== GameStage.POST_ROUND) {
            return Err(ErrorCode.INVALID_GAME_STATE);
        }

        this.turnIndex = this.order.indexOf(startingPlayerId);
        this.rollAllDice(); 
        this.claims = [];

        this.stage = GameStage.ROUND_ROBIN;
        
        return Ok(undefined);
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

    getOrder(): PlayerId[] {
        return this.order;
    }

    getTurnIndex(): number {
        return this.turnIndex;
    }

    getClaims(): Claim[] {
        return this.claims;
    }

    // Static

    private static generateGameCode(): GameCode {
        let gameCode: GameCode;
        do {
            gameCode = generate({
                exactly: 3,
                maxLength: 5,
                minLength: 4,
                join: "-",
                seed: Date.now().toString(),
            });
        } while (this.games.has(gameCode));

        return gameCode;
    }
    static get(gameCode: GameCode): Game | undefined {
        return this.games.get(gameCode);
    }
    static delete(gameCode: GameCode): void {
        this.games.delete(gameCode);
        // Additional cleanup such as notifying players, and dropping connections can be handled here.
    }
    static create(hostId: PlayerId): Result<{ gameCode: GameCode; game: Game }> {
        const gameCode = this.generateGameCode();
        const game = new Game(gameCode, hostId);
        this.games.set(gameCode, game);
        return Ok({ gameCode, game });
    }
}