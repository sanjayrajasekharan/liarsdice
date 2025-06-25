import { Game } from "../game/Game";
import { Player } from "../game/Player";
import { ClientMessage, ServerMessage } from "../../shared/protocol";
import { 
    gameStartedToProtocol, 
    roundStartedToProtocol, 
    claimMadeToProtocol, 
    challengeResultToProtocol,
    errorToProtocol 
} from "../adapters/protocolAdapter";

export function handleClientMessage(
    game: Game, 
    player: Player, 
    raw: string
): { broadcast?: ServerMessage; personal?: ServerMessage; sendDiceToPlayers?: boolean } | null {
    let msg;

    try {
        msg = JSON.parse(raw) as ClientMessage;
    } catch (error) {
        console.error("Invalid message format");
        return { personal: errorToProtocol('UNAUTHORIZED' as any, 'Invalid message format') };
    }

    switch (msg.type) {
        case "START_GAME": {
            const result = game.startGame(player.playerId);
            if (!result.ok) {
                return { personal: errorToProtocol(result.error, 'Failed to start game') };
            }
            return { 
                broadcast: gameStartedToProtocol(),
                sendDiceToPlayers: true // Signal to send dice to all players
            };
        }

        case "START_ROUND": {
            const result = game.startNextRound();
            if (!result.ok) {
                return { personal: errorToProtocol(result.error, 'Failed to start round') };
            }
            const startingPlayer = [...game.players.values()].find(p => p.index === game.turnIndex);
            if (startingPlayer) {
                return { 
                    broadcast: roundStartedToProtocol({
                        id: startingPlayer.playerId,
                        name: startingPlayer.name,
                        index: startingPlayer.index,
                        remainingDice: startingPlayer.remainingDice
                    }, []), // We'll send dice separately to each player
                    sendDiceToPlayers: true
                };
            }
            break;
        }

        case "CLAIM": {
            if (msg.claim) {
                const result = game.makeClaim(player.playerId, msg.claim);
                if (!result.ok) {
                    return { personal: errorToProtocol(result.error, 'Failed to make claim') };
                }
                return { 
                    broadcast: claimMadeToProtocol({ 
                        ...msg.claim, 
                        playerId: player.playerId 
                    })
                };
            }
            break;
        }

        case "CHALLENGE": {
            const result = game.challengeClaim(player.playerId);
            if (!result.ok) {
                return { personal: errorToProtocol(result.error, 'Failed to challenge claim') };
            }
            return { broadcast: challengeResultToProtocol(result.value) };
        }

        default:
            console.error(`Unknown message type: ${(msg as any).type}`);
            return { personal: errorToProtocol('UNAUTHORIZED' as any, 'Unknown message type') };
    }

    return null;
}
