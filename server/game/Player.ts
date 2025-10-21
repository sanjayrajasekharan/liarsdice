import { Result } from '../../shared/Result';
import { Claim } from './Claim';
import { Game } from './Game';

export class Player {
    private id: string;
    private name: string;
    private ws: WebSocket | null;
    private game: Game;
    private numberOfDice: number = 5;
    private dice: number[] = [];
    
    constructor(id: string, name: string, game: Game, ws?: WebSocket) {
        this.id = id;
        this.name = name;
        this.game = game;
        this.ws = ws ? ws : null;
    }

    makeClaim(quantity: number, faceValue: number): Result<void> {
        return this.game.addClaim(new Claim(this.id, quantity, faceValue));
    }

    getId(): string {
        return this.id;
    }
    getName(): string {
        return this.name;
    }
    setWebSocket(ws: WebSocket): void {
        this.ws = ws;
    }
    getWebSocket(): WebSocket | null {
        return this.ws;
 
    }

    rollDice(numDice: number): void {
        this.dice = [];
        for (let i = 0; i < numDice; i++) {
            this.dice.push(Math.floor(Math.random() * 6) + 1);
        }
    }

    getDiceCount(faceValue: number): number {
        return this.dice.filter(die => die === faceValue).length;
    }
}