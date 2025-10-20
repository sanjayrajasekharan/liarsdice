export enum Action {
    CLAIM = 'CLAIM',
    CHALLENGE = 'CHALLENGE',
    ROLL = 'ROLL',
    START_GAME = 'START_GAME',
    START_ROUND = 'START_ROUND',
}

export interface Claim {
    value: number;
    quantity: number;
}