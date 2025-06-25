import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { createGame, joinGame, gameExists, playerInGame, getGame } from './gameManager';
import { playerToProtocol, errorToProtocol } from './adapters/protocolAdapter';
import { handleClientMessage } from './sockets/router';
import { ErrorCode } from '../shared/types';
import { isClientMessage } from '../shared/protocol';

// Security configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const TOKEN_EXPIRY = '24h';

// Token payload interface
interface TokenPayload {
    playerId: string;
    gameCode: string;
    playerName: string;
    iat?: number;
    exp?: number;
}

// Input validation helpers
function isValidPlayerId(playerId: string): boolean {
    return typeof playerId === 'string' && 
           playerId.length >= 1 && 
           playerId.length <= 50 && 
           /^[a-zA-Z0-9_-]+$/.test(playerId);
}

function isValidPlayerName(playerName: string): boolean {
    return typeof playerName === 'string' && 
           playerName.trim().length >= 1 && 
           playerName.trim().length <= 30;
}

function sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
}
function generatePlayerToken(playerId: string, gameCode: string, playerName: string): string {
    const payload: TokenPayload = {
        playerId,
        gameCode,
        playerName
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// Verify and decode a player token
function verifyPlayerToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

// WebSocket connection management
const playerConnections = new Map<string, WebSocket>(); // playerId -> WebSocket
const gameConnections = new Map<string, Set<string>>(); // gameCode -> Set<playerId>

// Helper functions for WebSocket management
function addPlayerConnection(gameCode: string, playerId: string, ws: WebSocket) {
    playerConnections.set(playerId, ws);
    
    if (!gameConnections.has(gameCode)) {
        gameConnections.set(gameCode, new Set());
    }
    gameConnections.get(gameCode)!.add(playerId);
}

function removePlayerConnection(gameCode: string, playerId: string) {
    playerConnections.delete(playerId);
    
    const gameSet = gameConnections.get(gameCode);
    if (gameSet) {
        gameSet.delete(playerId);
        if (gameSet.size === 0) {
            gameConnections.delete(gameCode);
        }
    }
    
    console.log(`Player ${playerId} disconnected from game ${gameCode}`);
}

function broadcastToGame(gameCode: string, message: any, excludePlayerId?: string) {
    const gameSet = gameConnections.get(gameCode);
    if (!gameSet) return;
    
    const messageStr = JSON.stringify(message);
    gameSet.forEach(playerId => {
        if (playerId !== excludePlayerId) {
            const ws = playerConnections.get(playerId);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(messageStr);
            }
        }
    });
}

function sendToPlayer(playerId: string, message: any) {
    const ws = playerConnections.get(playerId);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

// Set up the Express application
const app = express();
app.use(cors());
app.use(express.json());

// Rate limiting to prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

// Stricter rate limiting for game creation/joining
const gameActionLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // Limit each IP to 10 game actions per 5 minutes
    message: 'Too many game actions, please try again later.',
});

app.use(['/create-game', '/join-game'], gameActionLimiter);


// HTTP API Endpoints

app.post("/create-game", (req, res) => {
    const { hostId, hostName } = req.body;
    
    if (!hostId || !hostName) {
        return res.status(400).json({ error: "Missing hostId or hostName" });
    }

    // Validate and sanitize input
    if (!isValidPlayerId(hostId)) {
        return res.status(400).json({ error: "Invalid hostId format" });
    }

    if (!isValidPlayerName(hostName)) {
        return res.status(400).json({ error: "Invalid hostName format" });
    }

    const sanitizedHostId = sanitizeInput(hostId);
    const sanitizedHostName = sanitizeInput(hostName);

    const gameCode = createGame(sanitizedHostId, sanitizedHostName);
    
    // Generate secure token for the host
    const token = generatePlayerToken(sanitizedHostId, gameCode, sanitizedHostName);

    res.status(201).json({ 
        gameCode, 
        token,
        message: "Game created, waiting for players to join" 
    });
    console.log(`Game created with code: ${gameCode}, host: ${sanitizedHostName} (${sanitizedHostId})`);
});

app.post("/join-game", (req, res) => {
    const { gameCode, playerId, playerName } = req.body;
    
    if (!gameCode || !playerId || !playerName) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate and sanitize input
    if (!isValidPlayerId(playerId)) {
        return res.status(400).json({ error: "Invalid playerId format" });
    }

    if (!isValidPlayerName(playerName)) {
        return res.status(400).json({ error: "Invalid playerName format" });
    }

    if (typeof gameCode !== 'string' || gameCode.length < 3 || gameCode.length > 20) {
        return res.status(400).json({ error: "Invalid gameCode format" });
    }

    const sanitizedPlayerId = sanitizeInput(playerId);
    const sanitizedPlayerName = sanitizeInput(playerName);
    const sanitizedGameCode = sanitizeInput(gameCode);
    
    console.log(`Join request with code: ${sanitizedGameCode}, playerId: ${sanitizedPlayerId}, playerName: ${sanitizedPlayerName}`);

    const result = joinGame(sanitizedGameCode, sanitizedPlayerId, sanitizedPlayerName);

    if (!result.ok) {
        console.error(`Error joining game: ${result.error}`);
        return res.status(400).json({ error: result.error });
    }

    // Generate secure token for the player
    const token = generatePlayerToken(sanitizedPlayerId, sanitizedGameCode, sanitizedPlayerName);

    // Convert domain Player to protocol message
    const protocolMessage = playerToProtocol(result.value);

    res.status(200).json({
        gameCode: sanitizedGameCode,
        token,
        playerMessage: protocolMessage,
        message: `Player ${result.value.playerId} (${sanitizedPlayerName}) joined the game`,
    });
});


// app.get("/game/:gameCode", (req, res) => {

//     console.log(`Checking if game exists with code: ${req.params.gameCode}`);

//     if (!gameExists(req.params.gameCode)) {
//         return res.status(404).json({ error: "Game not found" });
//     }

//     res.status(200);
// });
// Secure endpoint to verify player membership using token
app.post("/verify-membership", (req, res) => {
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({ error: "Token required" });
    }
    
    const tokenPayload = verifyPlayerToken(token);
    if (!tokenPayload) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
    
    const { gameCode, playerId } = tokenPayload;
    
    console.log(`Verifying membership for player ${playerId} in game ${gameCode}`);
    
    if (!gameExists(gameCode)) {
        return res.status(404).json({ error: "Game not found" });
    }

    if (!playerInGame(gameCode, playerId)) {
        return res.status(403).json({ error: "Player not in game" });
    }

    res.status(200).json({ 
        valid: true, 
        gameCode, 
        playerId,
        playerName: tokenPayload.playerName 
    });
});

// Create a single HTTP server instance
const server = app.listen(3000, () => {
    console.log("HTTP and WebSocket server is running on port 3000");
});

// Set up the WebSocket server using the same server instance
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
    if (!req.url || !req.headers.host) {
        console.error('Invalid connection: Missing URL or Host');
        ws.close();
        return;
    }

    // Basic CSRF protection - check for custom header
    const wsKey = req.headers['sec-websocket-protocol'];
    if (!wsKey || !wsKey.includes('liarsdice-game')) {
        console.error('Invalid connection: Missing security protocol');
        ws.close(1008, 'Invalid protocol');
        return;
    }

    const fullUrl = `ws://${req.headers.host}${req.url}`;
    const url = new URL(fullUrl);
    const queryParams = url.searchParams;

    const token = queryParams.get('token');

    if (!token) {
        console.error('Invalid connection: Missing authentication token');
        ws.send(JSON.stringify(errorToProtocol(ErrorCode.UNAUTHORIZED, 'Authentication token required')));
        ws.close(1008, 'Missing authentication token');
        return;
    }

    // Verify the token
    const tokenPayload = verifyPlayerToken(token);
    if (!tokenPayload) {
        console.error('Invalid connection: Invalid or expired token');
        ws.send(JSON.stringify(errorToProtocol(ErrorCode.UNAUTHORIZED, 'Invalid or expired token')));
        ws.close(1008, 'Invalid token');
        return;
    }

    const { gameCode, playerId, playerName } = tokenPayload;

    // Validate that the game exists and player is a member
    if (!gameExists(gameCode)) {
        ws.send(JSON.stringify(errorToProtocol(ErrorCode.GAME_NOT_FOUND, 'Game not found')));
        ws.close(1008, 'Game not found');
        return;
    }

    if (!playerInGame(gameCode, playerId)) {
        ws.send(JSON.stringify(errorToProtocol(ErrorCode.UNAUTHORIZED, 'Player not in game')));
        ws.close(1008, 'Player not in game');
        return;
    }

    // Additional security: Check if someone else is already connected with this playerId
    if (playerConnections.has(playerId)) {
        console.error(`Security alert: Attempted connection with already connected playerId: ${playerId}`);
        ws.send(JSON.stringify(errorToProtocol(ErrorCode.UNAUTHORIZED, 'Player already connected')));
        ws.close(1008, 'Player already connected');
        return;
    }

    // Add player to connection tracking
    addPlayerConnection(gameCode, playerId, ws);
    console.log(`Player ${playerName} (${playerId}) securely connected to game ${gameCode}`);

    // Get the game and player objects
    const game = getGame(gameCode);
    const player = game?.players.get(playerId);

    if (!game || !player) {
        ws.send(JSON.stringify(errorToProtocol(ErrorCode.GAME_NOT_FOUND, 'Game or player not found')));
        ws.close();
        return;
    }

    // Send initial game state to the connecting player
    const gameState = game.getPublicGameStateFor(player);
    sendToPlayer(playerId, { type: 'GAME_STATE', state: gameState });

    // Handle incoming messages
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            
            if (!isClientMessage(message)) {
                sendToPlayer(playerId, errorToProtocol(ErrorCode.UNAUTHORIZED, 'Invalid message format'));
                return;
            }

            // Use the router to handle the message
            const result = handleClientMessage(game, player, data.toString());
            
            if (result) {
                // Send personal message to the acting player if any
                if (result.personal) {
                    sendToPlayer(playerId, result.personal);
                }
                
                // Broadcast message to all players in the game if any
                if (result.broadcast) {
                    broadcastToGame(gameCode, result.broadcast);
                }
                
                // Send dice to all players if needed (after starting game/round)
                if (result.sendDiceToPlayers) {
                    game.players.forEach((p) => {
                        sendToPlayer(p.playerId, {
                            type: 'ROUND_STARTED',
                            startingPlayer: {
                                id: game.getCurrentPlayer().playerId,
                                name: game.getCurrentPlayer().name,
                                index: game.getCurrentPlayer().index,
                                remainingDice: game.getCurrentPlayer().remainingDice
                            },
                            dice: p.dice
                        });
                    });
                }
            }
            
            // Always send updated game state to all players after any action
            game.players.forEach((p) => {
                const gameState = game.getPublicGameStateFor(p);
                sendToPlayer(p.playerId, { type: 'GAME_STATE', state: gameState });
            });
            
        } catch (error) {
            console.error('Error handling message:', error);
            sendToPlayer(playerId, errorToProtocol(ErrorCode.UNAUTHORIZED, 'Invalid message'));
        }
    });

    // Handle connection close
    ws.on('close', () => {
        console.log(`Player ${playerId} disconnected from game ${gameCode}`);
        removePlayerConnection(gameCode, playerId);
    });

    // Handle connection errors
    ws.on('error', (error) => {
        console.error(`WebSocket error for player ${playerId}:`, error);
        removePlayerConnection(gameCode, playerId);
    });
});
