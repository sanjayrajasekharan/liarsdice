#!/usr/bin/env node

/**
 * Liar's Dice CLI Client
 * A simple command-line tool to connect and play the game
 * 
 * Usage:
 *   node cli-client.js create <playerName>           - Create a new game
 *   node cli-client.js join <gameCode> <playerName>  - Join existing game
 */

const io = require('socket.io-client');
const readline = require('readline');

const SERVER_URL = 'http://localhost:3000';

// ANSI colors for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

// Simple JWT decoder (does not verify signature - only for client-side display)
function decodeJWT(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = Buffer.from(parts[1], 'base64').toString('utf8');
        return JSON.parse(payload);
    } catch (error) {
        console.error('Failed to decode token:', error);
        return null;
    }
}

class GameClient {
    constructor() {
        this.socket = null;
        this.token = null;
        this.gameCode = null;
        this.playerName = null;
        this.playerId = null;
        this.myDice = [];
        this.playerNames = new Map(); // Map of playerId -> playerName
        this.gameState = {
            stage: 'PRE_GAME', // PRE_GAME, ROUND_ROBIN, POST_ROUND, POST_GAME
            currentTurn: null,
            hasGameStarted: false,
            hasRoundStarted: false,
            lastClaim: null
        };
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: colors.green + '> ' + colors.reset
        });
    }

    log(message, color = 'reset') {
        console.log(colors[color] + message + colors.reset);
    }

    getPlayerName(playerId) {
        if (playerId === this.playerId) {
            return `${this.playerName} (you)`;
        }
        return this.playerNames.get(playerId) || playerId;
    }

    async createGame(playerName) {
        this.playerName = playerName;
        this.log(`Creating game as ${playerName}...`, 'cyan');

        try {
            const response = await fetch(`${SERVER_URL}/api/games`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hostName: playerName })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.token = data.token;
            
            // Decode token to get player info
            const tokenData = decodeJWT(this.token);
            if (tokenData) {
                this.playerId = tokenData.playerId;
                this.playerName = tokenData.playerName;
                this.gameCode = tokenData.gameCode;
                this.playerNames.set(this.playerId, this.playerName);
            } else {
                this.gameCode = data.gameCode;
                this.playerId = data.playerId;
            }
            
            this.log(`\n✓ Game created! Code: ${this.gameCode}`, 'green');
            this.connectWebSocket();
            this.log('connected to websocket', 'green');            
        } catch (error) {
            this.log(`✗ Failed to create game: ${error.message}`, 'red');
            process.exit(1);
        }
    }

    async joinGame(gameCode, playerName) {
        this.gameCode = gameCode;
        this.playerName = playerName;
        this.log(`Joining game ${gameCode} as ${playerName}...`, 'cyan');

        try {
            const response = await fetch(`${SERVER_URL}/api/games/${gameCode}/players`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.token = data.token;
            this.playerId = data.playerId;
            this.log(`✓ Joined game!`, 'green');
            
            this.connectWebSocket();
        } catch (error) {
            this.log(`✗ Failed to join game: ${error.message}`, 'red');
            process.exit(1);
        }
    }

    connectWebSocket() {
        this.log('Connecting to game server...', 'cyan');
        this.log(`Token: ${this.token}`, 'cyan');

        this.socket = io(SERVER_URL, {
            query: { token: this.token },
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            this.log('✓ Connected to game server!', 'green');
            this.showHelp();
            this.rl.prompt();
        });

        this.socket.on('connect_error', (error) => {
            this.log(`\n✗ Connection error: ${error.message}`, 'red');
            console.error(error);
        });

        this.socket.on('disconnect', () => {
            this.log('\n✗ Disconnected from server', 'red');
            process.exit(0);
        });

        this.socket.on('GAME_STATE', (data) => {
            this.log(`\n✓ Received game state`, 'cyan');
            if (data && data.stage) {
                this.gameState.stage = data.stage;
                this.log(`   Stage: ${data.stage}`, 'cyan');
                if (data.players) {
                    // Extract player names from the game state
                    Object.entries(data.players).forEach(([playerId, playerData]) => {
                        if (playerData.name) {
                            this.playerNames.set(playerId, playerData.name);
                        }
                    });
                    const playerCount = Object.keys(data.players).length;
                    this.log(`   Players: ${playerCount}`, 'cyan');
                }
            }
            this.rl.prompt();
        });

        this.socket.on('PLAYER_JOINED', (data) => {
            if (data.playerName) {
                this.playerNames.set(data.playerId, data.playerName);
                this.log(`\n→ Player joined: ${data.playerName} (${data.playerId})`, 'yellow');
            } else {
                this.log(`\n→ Player joined: ${data.playerId}`, 'yellow');
            }
            this.rl.prompt();
        });

        this.socket.on('PLAYER_LEFT', (data) => {
            const name = this.getPlayerName(data.playerId);
            this.log(`\n→ Player left: ${name}`, 'yellow');
            this.rl.prompt();
        });

        this.socket.on('GAME_STARTED', (data) => {
            this.gameState.stage = 'ROUND_ROBIN';
            this.gameState.hasGameStarted = true;
            this.gameState.currentTurn = data.startingPlayerId;
            const startingPlayer = this.getPlayerName(data.startingPlayerId);
            this.log(`\nGAME STARTED! First player: ${startingPlayer}`, 'green');
            if (this.isMyTurn()) {
                this.log('*** IT\'S YOUR TURN! ***', 'yellow');
            }
            this.showAvailableActions();
            this.rl.prompt();
        });

        this.socket.on('ROUND_STARTED', (data) => {
            this.gameState.stage = 'ROUND_ROBIN';
            this.gameState.hasRoundStarted = true;
            this.gameState.currentTurn = data.startingPlayerId;
            this.gameState.lastClaim = null;
            const startingPlayer = this.getPlayerName(data.startingPlayerId);
            this.log(`\nNEW ROUND! First player: ${startingPlayer}`, 'green');
            if (this.isMyTurn()) {
                this.log('*** IT\'S YOUR TURN! ***', 'yellow');
            }
            this.showAvailableActions();
            this.rl.prompt();
        });

        this.socket.on('DICE_ROLLED', (data) => {
            this.myDice = data.dice;
            this.log(`\nYour dice: [${data.dice.join(', ')}]`, 'magenta');
            this.showAvailableActions();
            this.rl.prompt();
        });

        this.socket.on('CLAIM_MADE', (data) => {
            this.gameState.currentTurn = data.nextPlayerId;
            this.gameState.lastClaim = { playerId: data.playerId, quantity: data.quantity, faceValue: data.faceValue };
            const claimer = this.getPlayerName(data.playerId);
            const nextPlayer = this.getPlayerName(data.nextPlayerId);
            this.log(`\n${claimer} claims: ${data.quantity}x [${data.faceValue}]`, 'cyan');
            this.log(`   Next turn: ${nextPlayer}`, 'cyan');
            
            if (this.isMyTurn()) {
                this.log('*** IT\'S YOUR TURN! ***', 'yellow');
            }
            this.showAvailableActions();
            this.rl.prompt();
        });

        this.socket.on('CHALLENGE_MADE', (data) => {
            this.gameState.stage = 'POST_ROUND';
            this.gameState.lastClaim = null;
            this.gameState.currentTurn = null;
            const winner = this.getPlayerName(data.winnerId);
            const loser = this.getPlayerName(data.loserId);
            this.log(`\nCHALLENGE! Winner: ${winner} | Loser: ${loser}`, 'red');
            if (data.loserOut) {
                this.log(`   ${loser} is OUT!`, 'red');
            }
            this.showAvailableActions();
            this.rl.prompt();
        });

        this.socket.on('GAME_ENDED', (data) => {
            this.gameState.stage = 'POST_GAME';
            const winner = this.getPlayerName(data.winnerId);
            
            console.log('\n' + colors.cyan + '═══════════════════════════════════════════════════' + colors.reset);
            if (data.winnerId === this.playerId) {
                this.log('🎉 CONGRATULATIONS! YOU WON! 🎉', 'green');
            } else {
                this.log(`GAME OVER! Winner: ${winner}`, 'yellow');
            }
            console.log(colors.cyan + '═══════════════════════════════════════════════════' + colors.reset + '\n');
            
            this.log('Thanks for playing!', 'cyan');
            this.log('Disconnecting in 2 seconds...', 'yellow');
            setTimeout(() => {
                if (this.socket) {
                    this.socket.disconnect();
                }
                process.exit(0);
            }, 2000);
        });

        this.socket.on('error', (error) => {
            this.log(`\n✗ Error: ${error}`, 'red');
            this.rl.prompt();
        });

        this.setupCommandLine();
    }

    isMyTurn() {
        return this.gameState.currentTurn === this.playerId;
    }

    showAvailableActions() {
        console.log(colors.cyan + '\nAvailable actions:' + colors.reset);
        
        if (this.gameState.stage === 'PRE_GAME') {
            console.log(colors.yellow + '  start' + colors.reset + ' - Start the game');
        } else if (this.gameState.stage === 'POST_ROUND') {
            console.log(colors.yellow + '  roll' + colors.reset + ' - Start a new round');
        } else if (this.gameState.stage === 'POST_GAME') {
            console.log(colors.reset + '  Game has ended. Goodbye!');
            return; // Don't show other commands
        } else if (this.gameState.stage === 'ROUND_ROBIN') {
            if (this.isMyTurn()) {
                if (this.gameState.lastClaim) {
                    console.log(colors.yellow + '  claim <qty> <face>' + colors.reset + ' - Make a higher claim');
                    console.log(colors.yellow + '  challenge' + colors.reset + ' - Challenge the last claim');
                } else {
                    console.log(colors.yellow + '  claim <qty> <face>' + colors.reset + ' - Make the first claim');
                }
            } else {
                console.log(colors.reset + '  (waiting for other player\'s turn)');
            }
        }
        
        console.log(colors.yellow + '  dice' + colors.reset + ' - Show your dice');
        console.log(colors.yellow + '  help' + colors.reset + ' - Show all commands');
        console.log(colors.yellow + '  quit' + colors.reset + ' - Exit');
    }

    setupCommandLine() {
        this.rl.on('line', (line) => {
            const input = line.trim().toLowerCase();
            
            if (!input) {
                this.rl.prompt();
                return;
            }

            const parts = input.split(' ');
            const command = parts[0];

            try {
                switch (command) {
                    case 'start':
                        if (this.gameState.stage === 'PRE_GAME') {
                            this.socket.emit('START_GAME');
                            this.log('Starting game...', 'yellow');
                        } else {
                            this.log('Game already started!', 'red');
                        }
                        break;

                    case 'roll':
                        if (this.gameState.stage === 'POST_ROUND') {
                            this.socket.emit('START_ROUND');
                            this.log('Starting round...', 'yellow');
                        } else {
                            this.log('Can only roll at the end of a round!', 'red');
                        }
                        break;

                    case 'claim':
                    case 'c':
                        if (!this.isMyTurn()) {
                            this.log('Not your turn!', 'red');
                            break;
                        }
                        if (parts.length !== 3) {
                            this.log('Usage: claim <quantity> <face>', 'red');
                            break;
                        }
                        const quantity = parseInt(parts[1]);
                        const face = parseInt(parts[2]);
                        if (quantity < 1 || face < 1 || face > 6) {
                            this.log('Invalid claim. Quantity must be > 0, face must be 1-6', 'red');
                            break;
                        }
                        this.socket.emit('CLAIM', { quantity, faceValue: face });
                        this.log(`Claiming ${quantity}x [${face}]...`, 'yellow');
                        break;

                    case 'challenge':
                    case 'ch':
                        if (!this.isMyTurn()) {
                            this.log('Not your turn!', 'red');
                            break;
                        }
                        if (!this.gameState.lastClaim) {
                            this.log('No claim to challenge!', 'red');
                            break;
                        }
                        this.socket.emit('CHALLENGE');
                        this.log('Challenging...', 'yellow');
                        break;

                    case 'dice':
                        if (this.myDice.length > 0) {
                            this.log(`Your dice: [${this.myDice.join(', ')}]`, 'magenta');
                        } else {
                            this.log('No dice yet. Start a round first!', 'yellow');
                        }
                        break;

                    case 'help':
                    case 'h':
                        this.showHelp();
                        break;

                    case 'quit':
                    case 'exit':
                        this.log('Goodbye!', 'yellow');
                        process.exit(0);
                        break;

                    default:
                        this.log(`Unknown command: ${command}. Type 'help' for commands.`, 'red');
                }
            } catch (error) {
                this.log(`Error: ${error.message}`, 'red');
            }

            this.rl.prompt();
        });

        this.rl.on('close', () => {
            this.log('\nGoodbye!', 'yellow');
            process.exit(0);
        });
    }

    showHelp() {
        console.log('\n' + colors.cyan + '═══════════════════════════════════════════════════' + colors.reset);
        console.log(colors.bright + '  LIAR\'S DICE - All Commands' + colors.reset);
        console.log(colors.cyan + '═══════════════════════════════════════════════════' + colors.reset);
        console.log(colors.yellow + '  start' + colors.reset + '              - Start the game (lobby only)');
        console.log(colors.yellow + '  roll' + colors.reset + '               - Start a new round (after challenge)');
        console.log(colors.yellow + '  claim <qty> <face>' + colors.reset + ' - Make a claim (e.g., claim 3 5)');
        console.log(colors.yellow + '  challenge' + colors.reset + '          - Challenge the last claim');
        console.log(colors.yellow + '  dice' + colors.reset + '               - Show your dice');
        console.log(colors.yellow + '  help' + colors.reset + '               - Show this help');
        console.log(colors.yellow + '  quit' + colors.reset + '               - Exit the game');
        console.log(colors.cyan + '═══════════════════════════════════════════════════' + colors.reset);
        console.log(colors.reset + '\nNote: Only available actions for current game state will work.' + colors.reset + '\n');
        this.showAvailableActions();
    }
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log(colors.red + 'Usage:' + colors.reset);
    console.log('  node cli-client.js create <playerName>');
    console.log('  node cli-client.js join <gameCode> <playerName>');
    process.exit(1);
}

const client = new GameClient();
const mode = args[0].toLowerCase();

if (mode === 'create') {
    const playerName = args[1];
    client.createGame(playerName);
} else if (mode === 'join') {
    if (args.length < 3) {
        console.log(colors.red + 'Usage: node cli-client.js join <gameCode> <playerName>' + colors.reset);
        process.exit(1);
    }
    const gameCode = args[1];
    const playerName = args[2];
    client.joinGame(gameCode, playerName);
} else {
    console.log(colors.red + 'Invalid mode. Use "create" or "join"' + colors.reset);
    process.exit(1);
}
