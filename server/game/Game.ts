// class that manages the game state and logic
import { Player } from './Player';
import { Claim } from './Claim';
import { generate } from 'random-words';
import { Result, Ok, Err} from '../../shared/Result';
import { ErrorCode } from '../../shared/errors';

export class Game {
    private static readonly MAX_PLAYERS = 6;
    private static games: Map<string, Game> = new Map();

    private constructor(
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
        const player = new Player(playerId, playerName, ws);
        this.players.set(player.getId(), player);
        this.order.push(player.getId());
        return Ok({ playerId, player });
    }

    static create(hostId: string): Result<{ gameCode: string; game: Game }> {
        const gameCode = this.generateGameCode();
        const game = new Game(hostId);
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

}