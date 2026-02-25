import { DieFace, PlayerId } from 'shared/domain.js';

export class Player {
    private id: PlayerId;
    private name: string;
    private numberOfDice: number = 5;
    private dice: DieFace[] = [];

    constructor(id: PlayerId, name: string) {
        this.id = id;
        this.name = name;
    }

    getId(): PlayerId {
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
        this.numberOfDice--;
    }
}
