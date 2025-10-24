import { DieFace, PlayerId } from '../../shared/types';

export class Claim {
    private playerId: PlayerId;
    private quantity: number;
    private faceValue: DieFace;

    constructor(playerId: string, quantity: number, faceValue: DieFace) {
        this.playerId = playerId;
        this.quantity = quantity;
        this.faceValue = faceValue;
    }

    getPlayerId(): PlayerId {
        return this.playerId;
    }
    getQuantity(): number {
        return this.quantity;
    }
    getFaceValue(): DieFace {
        return this.faceValue;
    }
    validateAgainst(oldClaim: Claim): boolean {
        return (this.quantity > oldClaim.getQuantity()) ||
            (this.quantity === oldClaim.getQuantity() && this.faceValue > oldClaim.getFaceValue());
    }
}