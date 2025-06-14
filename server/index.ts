import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createGame, joinGame, handleGameConnection, gameExists, playerInGame } from './gameManager.js';

// Shared state for games
const games = {};

// Set up the Express application
const app = express();
app.use(cors());
app.use(express.json());


// HTTP API Endpoints

app.post("/create-game", (req, res) => {
    const gameCode = createGame(req.body.hostId, req.body.hostName);

    res.status(201).json({ gameCode, message: "Game created, waiting for players to join" });
    console.log(`Game created with code: ${gameCode}`);
});

app.post("/join-game", (req, res) => {
    const { gameCode, playerId, playerName } = req.body;
    console.log(`Join request with code: ${gameCode}, playerId: ${playerId}, playerName: ${playerName}`);

    const result = joinGame(gameCode, playerId, playerName);

    if (result.error) {
        console.error(`Error joining game: ${result.error}`);
        return res.status(400).json({ error: result.error });
    }

    res.status(200).json({
        gameCode,
        playerIndex: result.playerIndex,
        message: `Player ${playerId} (${playerName}) joined the game`,
    });
});


// app.get("/game/:gameCode", (req, res) => {

//     console.log(`Checking if game exists with code: ${req.params.gameCode}`);

//     if (!gameExists(req.params.gameCode)) {
//         return res.status(404).json({ error: "Game not found" });
//     }

//     res.status(200);
// });
// check if player is member of game
app.get("/member/:gameCode/:playerId", (req, res) => {

    console.log(`Checking if player ${req.params.playerId} is in game with code: ${req.params.gameCode}`);
    
    if (!gameExists(req.params.gameCode)) {
        return res.status(404).json({ error: "Game not found" });
    }

    if (!playerInGame(req.params.gameCode, req.params.playerId)) {
        return res.status(403).json({ error: "Player not found" });
    }

    res.status(200).json(true);
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
        ws.close(); // Close the connection if there's no URL or Host
        return;
    }

    const fullUrl = `ws://${req.headers.host}${req.url}`;
    const url = new URL(fullUrl);
    const queryParams = url.searchParams;

    const gameCode = queryParams.get('gameCode');
    const playerId = queryParams.get('playerId');

    if (!gameCode || !playerId) {
        console.error('Invalid connection: Missing gameCode or playerId');
        ws.send(JSON.stringify({ error: 'Missing gameCode or playerId' }));
        ws.close(1008, 'Missing gameCode or playerId');
        return;
    }

    // console.log(`New player connected: ${playerId} to game: ${gameCode}`);

    handleGameConnection(ws, gameCode, playerId);
});
