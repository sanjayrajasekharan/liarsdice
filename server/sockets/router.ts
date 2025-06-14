import { Game } from "../game/Game";
import { Player } from "../game/Player";
import { AnyClientMessage } from "../../shared/protocol";

export function handleClientMessage(game: Game, player: Player, raw: string) {
    let msg;

    try {
        msg = JSON.parse(raw) as AnyClientMessage;
    } catch (error) {
        player.send({
            type: "ERROR",
            payload: { code: 400, message: "Invalid message format" },
        });
        return;
    }

    switch (msg.type) {
        case "START_GAME":
            game.startGame(player);
            break;

        case "ROLL_FOR_START":
            game.rollForStart(player);
            break;

        case "CLAIM":
            game.makeClaim(player, msg.payload);
            break;

        case "CHALLENGE":
            game.challenge(player);
            break;

        case "ROLL":
            game.rollDice(player);
            break;

        default:
            player.send({
                type: "ERROR",
                payload: {
                    code: 400,
                    message: `Unknown message type: ${msg.type}`,
                },
            });
    }
}
