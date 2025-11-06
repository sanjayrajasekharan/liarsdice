# Liar's Dice
Liar's Dice is an online, link-sharing mulitplayer game implemented in this monorepo. 

## Project Structure
- client/ - React frontend for the game
- server/ - TS-Node backend for game logic and real-time communication
- shared/ - Shared types and utilities between client and server

## Language Preferences
- TypeScript for both client and server with strict typing
- TypeScript should not use Promises directly; use async/await syntax instead.

## Dev Environment Usage
- pnpm is used as the package manager.
- server:
    `pnpm run build` to compile the server 
    `pnpm run dev` to start the server in development mode
    `pnpm run start` to start the server in production mode
- client:
    `pnpm run dev` to start the React development server
    `pnpm run build` to create a production build

## Important Notes
- old-index.ts files are deprecated; just used to retain the old code for reference.

## Server
### Game
- Game.ts: Core game logic, player management, turn handling, and game state transitions.
- Player.ts: Player representation, including dice management and actions.
- Claim.ts: Represents a player's claim in the game.

The game directory contains the main logic for managing the game state, player actions, and game rules. It is seperate from the networking code to maintain a clear separation of concerns.

### REST
- index.ts : Entrypoint for REST API server.
- middleware/
  - limiter.ts: Rate limiting middleware to prevent abuse.
- routes/
  - games.ts: RESTful API endpoints for game management.

When a player joins or creates a game they must recieve a JWT token that will be used to authenticate their requests over the WebSocket connection.

#### Routes
/api/
  - /games
    - POST - Create a new game
    - GET - Get game state
    - /players
        - POST - Add a new player to the game 


### WebSocket


Game --> players, connections --> GameID --> {playerID: ws}


Connections:
{
    "apple-bannana-cherry": {
        "player1": WebSocket,
        "player2": WebSocket
    },
}

Games : 
{
    "apple-bannana-cherry": Game,
    "dog-cat-mouse": Game
}

Need to figure out how to handle outbound messages
Clean up closed connections