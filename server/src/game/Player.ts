import { Result } from '../../../shared/Result';
import { DieFace } from '../../../shared/types';
import { Claim } from './Claim';
import { Game } from './Game';

export class Player {
    private id: string;
    private name: string;
    private game: Game;
    private numberOfDice: number = 6;
    private dice: DieFace[] = [];

    constructor(id: string, name: string, game: Game) {
        this.id = id;
        this.name = name;
        this.game = game;
    }

    makeClaim(quantity: number, faceValue: DieFace): Result<void> {
        return this.game.addClaim(new Claim(this.id, quantity, faceValue));
    }

    getId(): string {
        return this.id;
    }
    getName(): string {
        return this.name;
    }

    getNumberOfDice(): number {
        return this.numberOfDice;
    }

    rollDice(): void {
        this.dice = [];
        for (let i = 0; i < this.numberOfDice; i++) {
            this.dice.push((Math.floor(Math.random() * 6) + 1) as DieFace);
        }
    }

    getDiceCount(faceValue: number): number {
        return this.dice.filter(die => die === faceValue).length;
    }

    getDice(): DieFace[] {
        return this.dice;
    }

    loseDie(): void {
        // # TODO handle players losing
        this.numberOfDice--;

    }
}