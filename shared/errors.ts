    export interface GameError {
    code: ErrorCode;
    details?: any;
}

export const ErrorCode = {
    INVALID_CLAIM: 'INVALID_CLAIM',
    INVALID_CHALLENGE: 'INVALID_CHALLENGE',
    GAME_NOT_FOUND: 'GAME_NOT_FOUND',
    ROUND_NOT_ACTIVE: 'ROUND_NOT_ACTIVE',
    OUT_OF_TURN: 'OUT_OF_TURN',
    UNAUTHORIZED: 'UNAUTHORIZED',
    GAME_IN_PROGRESS: 'GAME_IN_PROGRESS',
    NOT_ENOUGH_PLAYERS: 'NOT_ENOUGH_PLAYERS',
    PLAYER_ALREADY_EXISTS: 'PLAYER_ALREADY_EXISTS',
    GAME_ALREADY_EXISTS: 'GAME_ALREADY_EXISTS',
    PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
    GAME_FULL: 'GAME_FULL',
    INVALID_GAME_STATE: 'INVALID_GAME_STATE',
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

export const errorMessages: Record<ErrorCode, string> = {
    [ErrorCode.INVALID_CLAIM]: 'Claim must be higher than the previous claim',
    [ErrorCode.INVALID_CHALLENGE]: 'Cannot challenge nonexistent claim',
    [ErrorCode.GAME_NOT_FOUND]: 'Game not found',
    [ErrorCode.ROUND_NOT_ACTIVE]: 'Round not active',
    [ErrorCode.OUT_OF_TURN]: 'Attempting to make a move out of turn',
    [ErrorCode.UNAUTHORIZED]: 'Player not authorized for this action',
    [ErrorCode.GAME_IN_PROGRESS]: 'Game already in progress',
    [ErrorCode.NOT_ENOUGH_PLAYERS]: 'Not enough players to start the game',
    [ErrorCode.PLAYER_ALREADY_EXISTS]: 'Player with this ID already exists in the game',
    [ErrorCode.GAME_ALREADY_EXISTS]: 'Game with this code already exists',
    [ErrorCode.GAME_FULL]: 'Game is full, cannot add more players',
    [ErrorCode.INVALID_GAME_STATE]: 'Game is not in a valid state for this action',
    [ErrorCode.PLAYER_NOT_FOUND]: 'Player not found in the game',
};