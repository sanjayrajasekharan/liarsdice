import { Player } from '../game/Player';
import { Claim, PublicPlayer, ErrorCode } from '../../shared/types';
import { ServerMessage } from '../../shared/protocol';

// Protocol adapters: convert domain objects to protocol messages
export function playerToProtocol(player: Player): ServerMessage {
    return {
        type: 'PLAYER_JOINED',
        player: {
            id: player.playerId,
            name: player.name,
            index: player.index,
            remainingDice: player.remainingDice,
        }
    };
}

export function playerLeftToProtocol(player: Player): ServerMessage {
    return {
        type: 'PLAYER_LEFT',
        player: {
            id: player.playerId,
            name: player.name,
            index: player.index,
            remainingDice: player.remainingDice,
        }
    };
}

export function gameStartedToProtocol(): ServerMessage {
    return {
        type: 'GAME_STARTED',
    };
}

export function roundStartedToProtocol(startingPlayer: PublicPlayer, dice: number[]): ServerMessage {
    return {
        type: 'ROUND_STARTED',
        startingPlayer,
        dice,
    };
}

export function claimMadeToProtocol(claim: Claim & { playerId: string }): ServerMessage {
    return {
        type: 'CLAIM_MADE',
        claim,
    };
}

export function challengeResultToProtocol(result: {
    winnerIndex: number;
    loserIndex: number;
    totalDice: number;
    diceRemainingPerPlayer: number[];
    gameEnded: boolean;
}): ServerMessage {
    return {
        type: 'CHALLENGE_RESULT',
        winnerIndex: result.winnerIndex,
        loserIndex: result.loserIndex,
        totalDice: result.totalDice,
        diceRemainingPerPlayer: result.diceRemainingPerPlayer,
        gameEnded: result.gameEnded,
    };
}

export function errorToProtocol(code: ErrorCode, message: string): ServerMessage {
    return {
        type: 'ERROR',
        code,
        message,
    };
}
