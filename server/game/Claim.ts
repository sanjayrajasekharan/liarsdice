export class Claim {
    private playerId: string;
    private quantity: number;
    private faceValue: number;

    constructor(playerId: string, quantity: number, faceValue: number) {
        this.playerId = playerId;
        this.quantity = quantity;
        this.faceValue = faceValue;
    }

    getPlayerId(): string {
        return this.playerId;
    }
    getQuantity(): number {
        return this.quantity;
    }
    getFaceValue(): number {
        return this.faceValue;
    }
    validateAgainst(newClaim: Claim): boolean {
        return (newClaim.getQuantity() > this.quantity) ||
            (newClaim.getQuantity() === this.quantity && newClaim.getFaceValue() > this.faceValue);
    }
}