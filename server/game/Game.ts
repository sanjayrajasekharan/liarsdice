// class that manages the game state and logic
import { Player } from './Player';
import { Claim } from './Claim';
import { count, generate } from 'random-words';
import { Result, Ok, Err} from '../../shared/Result';
import { ErrorCode } from '../../shared/errors';
import { validate } from 'uuid';

export class Game {
    private static readonly MAX_PLAYERS = 6; // change to reed from shared config in future
    private static games: Map<string, Game> = new Map();

    private constructor(
        private gameCode: string,
        private hostId: string, 
        private players: Map<string, Player> = new Map(), 
        private order: string[] = [],
        private turnIndex: number = 0,
        private claims: Claim[] = [],
    ) {}

    public createPlayer(playerName: string, ws: WebSocket): Result<{ playerId: string; player: Player }> {
        if (this.players.size >= Game.MAX_PLAYERS) {
            return Err(ErrorCode.GAME_FULL, `Only a maximum of ${Game.MAX_PLAYERS} players are allowed.`);
        }
        const playerId = this.generateUniquePlayerId();
        const player = new Player(playerId, playerName, this, ws);
        this.players.set(player.getId(), player);
        this.order.push(player.getId());
        return Ok({ playerId, player });
    }

    static create(hostId: string): Result<{ gameCode: string; game: Game }> {
        const gameCode = this.generateGameCode();
        const game = new Game(gameCode, hostId);
        this.games.set(gameCode, game);
        return Ok({ gameCode, game });
    }

    private generateUniquePlayerId(): string {
        let playerId: string;
        do {
            playerId = Math.random().toString(36).substring(2, 10);
        } while (this.players.has(playerId));
        return playerId;
    }

    private static generateGameCode(): string {
        let gameCode: string;
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

    static get(gameCode: string): Game | undefined {
        return this.games.get(gameCode);
    }
    static delete(gameCode: string): void {
        this.games.delete(gameCode);
        // Additional cleanup such as notifying players, and dropping connections can be handled here.
    }

    getGameCode(): string {
        return this.gameCode;
    }

    getHostId(): string {
        return this.hostId;
    }

    getPlayers(): Map<string, Player> {
        return this.players;
    }

    getOrder(): string[] {
        return this.order;
    }

    getTurnIndex(): number {
        return this.turnIndex;
    }

    getClaims(): Claim[] {
        return this.claims;
    }

    validateTurn(playerId: string): Result<void> {
        const currentPlayerId = this.order[this.turnIndex];
        if (currentPlayerId !== playerId) {
            return Err(
                ErrorCode.INVALID_TURN, 
                `It is not player ${playerId}'s turn. Current turn: ${currentPlayerId}`
            );
        }
        return Ok(undefined);
    }

    addClaim(claim: Claim): Result<void> {
        const turnValidation = this.validateTurn(claim.getPlayerId());
        if (!turnValidation.ok) {
            return turnValidation;
        }
        const lastClaim = this.claims[this.claims.length - 1];
        if (!claim.validateAgainst(lastClaim)) {
            return Err(ErrorCode.INVALID_CLAIM, 
                // #TODO replace these string literals with templates
                `Claim ${claim.getQuantity()} of ${claim.getFaceValue()} is not valid against ${lastClaim.getQuantity()} of ${lastClaim.getFaceValue()}`
            );
        }
        this.claims.push(claim);
        return Ok(undefined);
    }

    challenge(playerId: string): Result<string> {
        const turnValidation = this.validateTurn(playerId);
        if (!turnValidation.ok) {
            return turnValidation;
        }

        const lastClaim = this.claims[this.claims.length - 1];
        const [quantity, faceValue] = [lastClaim.getQuantity(), lastClaim.getFaceValue()];

        const winner = this.countDice(faceValue) < quantity ? playerId : lastClaim.getPlayerId();
        return Ok(winner);
    }

    countDice(faceValue: number): number {
        return Array.from(this.players.values()).reduce((total, player) => {
            return total + player.getDiceCount(faceValue);
        }, 0);
    }
}