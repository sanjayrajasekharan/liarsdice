export interface Opponent {
    name: string;
    id: string;
    remainingDice: number;
    index: number;
    dice: number[];
}

export interface Player {
    isHost: boolean;
    name: string;
    remainingDice: number;
    dice: number[];
    index: number;
    id: string;
}

export interface SanitizedGameState {
    host: string;
    currentClaim: any; // Replace 'any' with the appropriate type for currentClaim
    turnIndex: number;
    gameStage: any; // Replace 'any' with the appropriate type for gameStage
    opponents: Opponent[];
    player: Player;
}
