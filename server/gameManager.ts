import WebSocket from "ws";
import { generate } from "random-words";
import { ErrorCode, errorDescription } from "../shared/errorCodes.js";
import {
    ServerMessage,
    PlayerMessage,
    ErrorMessage,
} from "../shared/messages.js";
import { GameStage, StateChange } from "../shared/states.js";
import { Action } from "../shared/actions.js";
import { send } from "process";
import { randomUUID } from "crypto";
import { SanitizedGameState } from "../shared/types.js";

export interface Player {
    name: string;
    privateId: string; // change to hash
    publicId: string;
    ws: WebSocket | null;
    dice: number[];
    remainingDice: number;
    hasRolled: boolean; // flag to check if the player has rolled the dice (for the current round)
    startRoll: number | null; // roll for determining the starting player
    index: number; // index of the player in the players array,
    active: boolean; // flag to check if the player is still in the game;
}

export interface Game {
    hostId: string;
    players: { [playerId: string]: Player };
    numPlayers: number;
    currentClaim: { quantity: number; value: number } | null;
    turnIndex: number;
    gameStage: GameStage;
    numPlayersRolled: number;
}

export type GameCode = string;

// Store the games by gameCode
const games: { [gameCode: GameCode]: Game } = {};

export function gameExists(gameCode: GameCode): boolean {
    return !!games[gameCode];
}

export function playerInGame(gameCode: GameCode, playerId: string): boolean {
    return games[gameCode].players[playerId] !== undefined;
}

export function createGame(hostId: string, hostName: string): GameCode {
    console.log(`Creating game for host: ${hostId} (${hostName})`);
    let gameCode: GameCode;
    do {
        gameCode = generate({
            exactly: 3,
            maxLength: 5,
            minLength: 4,
            join: "-",
            seed: Date.now().toString(),
        });
    } while (games[gameCode]);

    const host = {
        name: hostName,
        privateId: hostId,
        publicId: randomUUID(), //generate a random code for the player to share with others
        ws: null,
        remainingDice: 6,
        dice: [],
        hasRolled: false,
        index: 0,
        active: false,
        startRoll: null,
    };

    games[gameCode] = {
        hostId: hostId,
        players: { [hostId]: host },
        numPlayers: 1,
        currentClaim: null,
        turnIndex: 0,
        gameStage: GameStage.PRE_GAME,
        numPlayersRolled: 0,
    };

    console.log(games);

    return gameCode;
}

export function joinGame(
    gameCode: string,
    playerId: string,
    playerName: string
) {
    if (!games[gameCode]) {
        return { error: "Game not found" };
    } else if (
        games[gameCode].players[playerId] &&
        games[gameCode].players[playerId].active
    ) {
        return { error: "Player already in the game" };
    } else if (games[gameCode].numPlayers >= 6) {
        return { error: "Game is full" };
    } else if (games[gameCode].gameStage !== GameStage.PRE_GAME) {
        return { error: "Game is in progress" };
    }

    if (!games[gameCode].players[playerId]) {
        games[gameCode].players[playerId] = {
            name: playerName,
            privateId: playerId,
            publicId: randomUUID(),
            ws: null,
            remainingDice: 6,
            dice: [],
            hasRolled: false,
            startRoll: null,
            index: games[gameCode].numPlayers,
            active: false,
        };

        games[gameCode].numPlayers += 1;
    }

    return {
        gameCode,
        playerIndex: games[gameCode].players[playerId].index,
        message: `Player ${playerId} (${playerName}) joined the game`,
    };
}

function removePlayer(gameCode: string, playerId: string) : void {
    const game = games[gameCode];
    const player = game.players[playerId];

    delete game.players[playerId];
    game.numPlayers -= 1;

    if (game.numPlayers == 0) {
        delete games[gameCode];
    }

    const playerIndex = player.index

    //map

    Object.keys(game.players).forEach((pId : string) => {
        const p = game.players[pId];
        if (game.hostId == playerId && p.index == 1 + playerIndex) {
            game.hostId = pId;
        }
        if (p.index > playerIndex) {
            p.index -= 1;
        }
    }
);
}

// Function to handle a new WebSocket connection for a game room
export function handleGameConnection(
    ws: WebSocket,
    gameCode: string,
    playerId: string
) {
    let game = games[gameCode];

    if (!game) {
        console.error(
            `${ErrorCode.GAME_NOT_FOUND} : ${
                errorDescription[ErrorCode.GAME_NOT_FOUND] + ": " + gameCode
            }`
        ); // Error that's getting flagged
        ws.close(
            1008,
            JSON.stringify({
                error: ErrorCode.GAME_NOT_FOUND,
                message: errorDescription[ErrorCode.GAME_NOT_FOUND],
            })
        );
        return;
    }

    const player = game.players[playerId];
    if (!player) {
        console.error(`Player ${playerId} not member of game ${gameCode}`);
        ws.close(
            1008,
            JSON.stringify({
                error: ErrorCode.UNAUTHORIZED,
                message: errorDescription[ErrorCode.UNAUTHORIZED],
            })
        );
        return;
    } else {
        player.ws = ws;
        player.active = true;
        console.log(`Player ${playerId} connected to game ${gameCode}`);
        broadcastMessageToAll(
            game,
            {
                change: StateChange.PLAYER_JOINED,
                player: {
                    name: player.name,
                    index: player.index,
                    id: player.publicId,
                },
            },
            player
        );
        sendGameStateToPlayer(player, gameCode);
    }

    // need funciton for users who are joining game to show up on existing players screen

    ws.on("error", (error) => {
        console.error(`WebSocket error in game ${gameCode}: ${error}`);
    });

    ws.on("message", (message) => {
        handleMessage(gameCode, playerId, JSON.parse(message.toString()));
    });

    ws.on("close", () => {
        console.log(`${playerId} disconnected from game: ${gameCode}`);
        broadcastMessageToAll(game, {
            change: StateChange.PLAYER_LEFT,
            player: {
                name: player.name,
                index: player.index,
                id: player.publicId,
            },
        });
        player.ws = null;
        player.active = false;
        
        if (game.gameStage == GameStage.PRE_GAME) {
            removePlayer(gameCode, playerId);
        }
    });

    // broadcastGameState(gameCode);
}

function handleMessage(
    gameCode: string,
    playerId: string,
    message: PlayerMessage
) {
    let game = games[gameCode];
    let player = game.players[playerId];

    switch (message.action) {
        case Action.START_GAME:
            startGame(game, player);
            break;
        case Action.START_ROUND:
            startRound(game, player);
            break;
        case Action.CLAIM:
            if (!message.claim) {
                console.error("Missing claim in message");
                return;
            }
            makeClaim(game, player, message.claim);
            break;
        case Action.CHALLENGE:
            makeChallenge(game, player);
            break;
        case Action.ROLL:
            rollDice(player, game);
            break;
        case Action.ROLL_FOR_START:
            rollForStart(player, game);
            break;
        default:
            console.error(`Invalid action: ${message.action}`);
    }
    console.log(games[gameCode]);
}

function startGame(game: Game, player: Player) {
    if (game.hostId !== player.privateId) {
        sendErrorToPlayer(player, ErrorCode.UNAUTHORIZED);
    } else if (game.gameStage !== GameStage.PRE_GAME) {
        sendErrorToPlayer(player, ErrorCode.GAME_IN_PROGRESS);
    } else if (Object.keys(game.players).length < 2) {
        sendErrorToPlayer(player, ErrorCode.NOT_ENOUGH_PLAYERS);
    }

    game.gameStage = GameStage.START_SELECTION;

    broadcastMessageToAll(game, { change: StateChange.GAME_STARTED });
}

function startRound(game: Game, player: Player) {
    if (game.gameStage !== GameStage.START_SELECTION) {
        sendErrorToPlayer(player, ErrorCode.ROUND_NOT_ACTIVE);
    } else if (player.privateId !== game.hostId) {
        sendErrorToPlayer(player, ErrorCode.UNAUTHORIZED);
    } else {
        game.gameStage = GameStage.START_SELECTION;
        game.currentClaim = null;

        broadcastMessageToAll(game, { change: StateChange.ROUND_STARTED });
    }
}

// Function to handle making a claim
function makeClaim(
    game: Game,
    player: Player,
    claim: { quantity: number; value: number }
) {
    if (game.gameStage !== GameStage.ROUND_ROBBIN) {
        sendErrorToPlayer(player, ErrorCode.ROUND_NOT_ACTIVE);
    } else if (player.privateId !== game.players[game.turnIndex].privateId) {
        sendErrorToPlayer(player, ErrorCode.OUT_OF_TURN);
    } else if (!isValidClaim(game.currentClaim, claim)) {
        sendErrorToPlayer(player, ErrorCode.INVALID_CLAIM);
    } else {
        game.currentClaim = claim;
        game.turnIndex = (game.turnIndex + 1) % game.numPlayers;

        broadcastMessageToAll(game, {
            change: StateChange.CLAIM_MADE,
            claim,
        });
    }
}

// Function to handle calling a player a liar
function makeChallenge(game: Game, player: Player) {
    if (game.gameStage !== GameStage.ROUND_ROBBIN) {
        sendErrorToPlayer(player, ErrorCode.ROUND_NOT_ACTIVE);
    } else if (player.privateId !== game.players[game.turnIndex].privateId) {
        sendErrorToPlayer(player, ErrorCode.OUT_OF_TURN);
    } else if (!game.currentClaim) {
        sendErrorToPlayer(player, ErrorCode.INVALID_CHALLENGE);
    } else {
        const totalDice = countDice(game, game.currentClaim!.value);
        const isChallengeSuccesful = totalDice < game.currentClaim!.quantity;

        let loser: Player;
        let winner: Player;

        if (isChallengeSuccesful) {
            loser = game.players[game.turnIndex - (1 % game.numPlayers)];
            winner = game.players[game.turnIndex];
        } else {
            loser = game.players[game.turnIndex];
            winner = game.players[game.turnIndex - (1 % game.numPlayers)];
        }

        loser.remainingDice -= 1;

        let gameEnded = Object(game.players).every(
            (p: Player) => p !== winner || p.remainingDice === 0
        );

        game.currentClaim = null;
        game.gameStage = GameStage.POST_ROUND;

        // Players need to roll for the next round
        Object(game.players).forEach((p: Player) => {
            p.hasRolled = false;
            p.startRoll = null;
        });
        game.numPlayersRolled = 0;

        game.currentClaim = null;

        if (gameEnded) {
            game.gameStage = GameStage.POST_GAME;
        } else {
            game.gameStage = GameStage.POST_ROUND;
        }

        broadcastMessageToAll(game, {
            change: StateChange.CHALLENGE_MADE,
            challenge: {
                winner: winner.index,
                loser: loser.index,
                totalDice,
                dicePerPlayer: Object(game.players).map(
                    (p: Player) => p.remainingDice
                ),
                gameEnded,
            },
        });
    }
}

function rollForStart(player: Player, game: Game) {
    if (player.hasRolled) {
        sendErrorToPlayer(player, ErrorCode.OUT_OF_TURN);
        return;
    }

    player.hasRolled = true;
    game.numPlayersRolled += 1;
    player.startRoll = Math.floor(Math.random() * 6) + 1;
    broadcastMessageToAll(game, {
        change: StateChange.DICE_ROLLING_STARTED,
        roll: player.startRoll,
    });

    if (game.numPlayersRolled === game.numPlayers) {
        // Typecast players array properly
        const playersArray = Object.values(game.players) as Player[];

        // Find the player with the highest roll
        game.turnIndex = playersArray.reduce(
            (maxIdx, currentPlayer, currentIndex) =>
                currentPlayer.startRoll! > playersArray[maxIdx].startRoll!
                    ? currentIndex
                    : maxIdx,
            0
        );

        const startingPlayer = playersArray[game.turnIndex];

        broadcastMessageToAll(game, {
            change: StateChange.ROUND_STARTED,
            player: {
                name: startingPlayer.name,
                index: startingPlayer.index,
                id: startingPlayer.publicId,
            },
        });
    }
}

// Utility to roll a die (returns a value between 1 and 6)
function rollDice(player: Player, game: Game) {
    if (player.hasRolled) {
        return sendErrorToPlayer(player, ErrorCode.OUT_OF_TURN);
    } else if (game.gameStage === GameStage.DICE_ROLLING) {
        for (let i = 0; i < player.remainingDice; i++) {
            player.dice.push(Math.floor(Math.random() * 6) + 1);
        }
        player.hasRolled = true;
        game.numPlayersRolled += 1;

        sendMessageToPlayer(player, {
            change: StateChange.DICE_ROLLED,
            rolls: player.dice,
        });

        if (game.numPlayersRolled === game.numPlayers) {
            broadcastMessageToAll(game, { change: StateChange.ROUND_STARTED });
        }
    }
}

// communication utilities

function sendErrorToPlayer(player: Player, errorCode: ErrorCode) {
    if (player && player.ws && player.ws.readyState === WebSocket.OPEN) {
        let error: ErrorMessage = {
            errorCode: errorCode,
            errorMessage: errorDescription[errorCode],
        };
        player.ws.send(JSON.stringify({ error }));
    }
}

function sendGameStateToPlayer(player: Player, gameCode: GameCode) {
    let game = games[gameCode];

    let sanitizedGameState : SanitizedGameState = {
        host: game.players[game.hostId].publicId,
        currentClaim: game.currentClaim,
        turnIndex: game.turnIndex,
        gameStage: game.gameStage,

        opponents: Object.values(game.players)
            .filter((p) => p.privateId !== player.privateId)
            .map((player) => ({
                name: player.name,
                remainingDice: player.remainingDice,
                index: player.index,
                id: player.privateId,
                dice: player.dice
            }))

            .sort((a, b) => a.index - b.index),
        player: {
            name: player.name,
            remainingDice: player.remainingDice,
            dice: player.dice,
            index: player.index,
            id: player.publicId,
            isHost: player.privateId === game.hostId,
        },
    };

    sendMessageToPlayer(player, { change: StateChange.YOU_JOINED, gameState: sanitizedGameState });
}

function sendMessageToPlayer(player: Player, message: ServerMessage) {
    if (player && player.ws && player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(message));
    }
}

// Utility to broadcast a specific message to all players
function broadcastMessageToAll(
    game: Game,
    message: ServerMessage,
    exclude: Player | null = null
) {
    const playersArray = Object.values(game.players) as Player[];
    playersArray.forEach((player: Player) => {
        if (player !== exclude) sendMessageToPlayer(player, message);
    });
}

function isValidClaim(
    previousClaim: { quantity: number; value: number } | null,
    newClaim: { quantity: number; value: number }
): boolean {
    if (previousClaim === null) {
        return true;
    }
    return (
        newClaim.quantity > previousClaim.quantity ||
        (newClaim.quantity === previousClaim.quantity &&
            newClaim.value > previousClaim.value)
    );
}

// Utility to count the total number of dice showing the specified value across all players
function countDice(game: Game, value: number): number {
    const playersArray = Object.values(game.players) as Player[];
    return playersArray.reduce((total, player) => {
        return total + player.dice.filter((die) => die === value).length;
    }, 0);
}
