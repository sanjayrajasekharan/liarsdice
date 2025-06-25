# Liar's Dice Server

TypeScript backend for multiplayer Liar's Dice with WebSockets and JWT auth.

## Quick Start
```bash
pnpm install
cd server && pnpm run dev
```

Set `JWT_SECRET` env var for production.

## Architecture

```
server/
├── index.ts              # HTTP/WebSocket server + security
├── gameManager.ts        # Game lifecycle management
├── game/                 # Domain logic (pure, no protocol deps)
│   ├── Game.ts          # Game state & rules
│   └── Player.ts        # Player entities & dice
├── adapters/            # Protocol conversion layer
│   └── protocolAdapter.ts
└── sockets/
    └── router.ts        # WebSocket message routing
```

## How It Works

**HTTP**: Game creation/joining returns JWT tokens
**WebSocket**: All gameplay with token auth required

Game flow:
1. Create/join game via HTTP → get token
2. Connect to WebSocket with token
3. Real-time gameplay (start, bid, challenge)
4. Server pre-rolls dice each round for security

## Security

- JWT tokens required for all WebSocket connections
- Rate limiting: 100 req/15min general, 10 req/5min for game actions
- Input validation/sanitization on all user data
- Anti-impersonation: one connection per player
- CSRF protection via custom WebSocket protocol header

## API

### HTTP Endpoints
- `POST /create-game` - Create game, get token
- `POST /join-game` - Join game, get token  
- `POST /verify-membership` - Validate token

### WebSocket Messages
**Client:** `START_GAME`, `CLAIM`, `CHALLENGE`
**Server:** `GAME_STATE`, `ROUND_STARTED`, `CLAIM_MADE`, `CHALLENGE_RESULT`, etc.

Connection: `ws://localhost:3000/?token=jwt_token`
Header: `Sec-WebSocket-Protocol: liarsdice-game`

## Key Files

- `index.ts` - HTTP/WebSocket server, JWT auth, rate limiting, connection management
- `game/Game.ts` - Core game logic, state management, dice rolling, win conditions
- `sockets/router.ts` - WebSocket message routing and game action coordination
- `adapters/protocolAdapter.ts` - Domain to protocol type conversion
- `gameManager.ts` - Game instance creation, storage, and player membership
