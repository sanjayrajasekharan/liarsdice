# Liar's Dice - AI Coding Agent Instructions

## Project Overview
Liar's Dice is a real-time multiplayer dice game built as a **pnpm monorepo** with three workspaces: `client/` (React + Vite), `server/` (Node + Express + Socket.IO), and `shared/` (common types). The game uses WebSocket for real-time updates, JWT for auth, and in-memory storage for game state.

## Architecture & Data Flow

### Communication Pattern
```
Client (REST) → Server → JWT Token → Client (WebSocket) → Server
```
1. Player joins/creates game via **REST API** (`/games`, `/game/:code/players`) → receives JWT token
2. Client connects via **WebSocket** with token in query param (`?token=...`)
3. Server validates token in `authMiddleware`, attaches `playerId` and `gameCode` to socket
4. Game actions flow through Socket.IO events (see `shared/actions.ts` and `shared/states.ts`)

### Server Architecture (Inversify DI)
- **Store** (`app/Store.ts`): In-memory Map of games (replace with DB for production)
- **GameService** (`app/GameService.ts`): Business logic facade over `Game` domain model
- **Game** (`game/Game.ts`): Pure game logic (turn validation, claim checking, challenge resolution)
- **GameController** (`sockets/GameController.ts`): Socket.IO event handlers using custom decorators (`@socketController`, `@event`, `@onConnect`)
- **GamesManagerController** (`rest/GamesMangerController.ts`): REST API for game creation/joining

**DI Bindings** (see `server/src/index.ts`):
- Store, GameService, GamesManagerService: singleton scope
- GameController: bound by class reference for socket-builder resolution

### Custom Socket Framework
The server uses a **custom decorator-based Socket.IO framework** (`sockets/socket-utils/`):
- `@socketController(namespace?, middleware?)`: marks class as socket controller
- `@event(eventName)`: binds method to Socket.IO event
- `@onConnect()`, `@onDisconnect()`: lifecycle hooks
- `buildSocketServer()` in `socket-builder.ts` wires decorators to Socket.IO

**Example** (`GameController.ts`):
```typescript
@socketController(undefined, authMiddleware)
export class GameController extends SocketController {
    @event(Action.CLAIM)
    handleClaim(socket: Socket, data: {faceValue: DieFace, quantity: number}) {
        const playerId = socket.playerId!; // injected by authMiddleware
        // ...
    }
}
```

### Client State Management (Zustand)
- `client/src/store/gameStore.ts`: Single Zustand store for game state
- **No Redux/Context** - use `useGameState()` hook everywhere
- Store includes: `webSocket`, `gameState` (backend state), `isRolling`, `hasRolledThisRound` (UI state)

### Shared Types (`shared/`)
- `types.ts`: Core types (`PlayerId`, `GameCode`, `DieFace`, `GameStage`, message types)
- `actions.ts`: Client → Server actions (`CLAIM`, `CHALLENGE`, `START_GAME`, `START_ROUND`)
- `states.ts`: Server → Client state changes (`PLAYER_JOINED`, `DICE_ROLLED`, etc.)
- `Result.ts`: Type-safe error handling - **NEVER use try/catch for game logic**, use `Result<T>` monad with `Ok(value)` / `Err(ErrorCode)`

## Development Commands

### Running the Project
```powershell
# From workspace root
pnpm install          # Install all workspaces

# Server (terminal 1)
cd server
pnpm run dev          # Starts nodemon + tsx on port 3000

# Client (terminal 2)
cd client
pnpm run dev          # Starts Vite dev server on port 5173

# Build
cd server; pnpm run build  # Compiles TypeScript to dist/
cd client; pnpm run build  # Builds production assets to dist/
```

### Testing
```powershell
cd server
pnpm run test         # Runs Mocha tests in game/test/
pnpm run test:watch   # Watch mode
```
**Test Pattern**: Use Chai BDD (`expect(...).to.be.true`), test `Result<T>` return types with `result.ok` checks (see `Game.test.ts`)

## Code Conventions

### TypeScript Style
- **NO Promises directly** - use `async/await` syntax exclusively
- Strict typing enabled across all workspaces
- Import paths use explicit `.js` extensions for ES modules (e.g., `import { Game } from '../Game.js'`)

### Result Type Error Handling
Never throw errors for expected game logic failures. Use `Result<T>`:
```typescript
// ✅ CORRECT
function makeClaim(claim: Claim): Result<void> {
    if (invalidClaim) return Err(ErrorCode.INVALID_CLAIM);
    return Ok(undefined);
}

// ❌ WRONG
function makeClaim(claim: Claim): void {
    if (invalidClaim) throw new Error("Invalid claim");
}
```

Check results with `isErr(result)` helper:
```typescript
const claimResult = game.addClaim(claim);
if (isErr(claimResult)) {
    return Err(claimResult.error); // propagate error
}
```

### React Component Patterns
- **CSS Modules** for all styles (`Component.module.css` + `import styles from './Component.module.css'`)
- Use `clsx` for conditional class names
- Framer Motion for animations (see `components/Reveal/transitions.ts`)
- Mock components for testing (`*Mock.tsx` files) - these are for development/demo purposes

### Design System
Follow `client/DESIGN_SYSTEM.md` strictly:
- **NO hardcoded pixel values** - use CSS custom properties (`--space-base`, `--space-lg`, etc.)
- Colors: `--surface-primary`, `--text-primary`, `--color-primary-500` (theme-aware)
- Typography scale: `--text-xs` through `--text-3xl`
- Spacing scale: `--space-xs` (4px) through `--space-5xl` (96px)

**Example**:
```css
/* ❌ WRONG */
.button { padding: 16px 24px; }

/* ✅ CORRECT */
.button { padding: var(--space-base) var(--space-lg); }
```

## Game-Specific Logic

### Turn Validation Pattern
All player actions (claims, challenges) **must validate turn ownership** via `Game.validateTurn(playerId)` before proceeding. The `Game` class tracks `turnIndex` and `order` arrays.

### WebSocket Message Flow
1. Client emits action with `Action` enum (e.g., `socket.emit(Action.CLAIM, { faceValue, quantity })`)
2. Server validates via `GameService` → `Game` methods
3. Server broadcasts `StateChange` event to game room (e.g., `io.to(gameCode).emit(StateChange.CLAIM_MADE, message)`)
4. Client updates Zustand store via `gameService.ts` message handlers

### JWT Token Flow
- Generated in `auth/utils.ts` with `generatePlayerToken(playerId, playerName, gameCode)`
- Stored in `localStorage` as `"gameToken"`
- Verified in `sockets/middleware/authMiddleware.ts`, which extends socket with `socket.playerId` and `socket.gameCode`

## File Naming
- `old-index.ts` files are deprecated - **DO NOT EDIT** (legacy code for reference)
- Components: PascalCase with matching folder (`GameRoom/GameRoom.tsx`)
- CSS Modules: `Component.module.css`
- Tests: `*.test.ts` in `test/` subdirectories

## Key Files for AI Context
- `server/src/index.ts`: DI setup and server initialization
- `server/src/game/Game.ts`: Core game rules (lines 1-100 for turn/claim logic)
- `server/src/sockets/GameController.ts`: WebSocket event handlers
- `client/src/services/gameService.ts`: Client API/WebSocket wrapper
- `client/src/store/gameStore.ts`: Global state management
- `shared/types.ts`, `actions.ts`, `states.ts`: Protocol definitions
- `client/DESIGN_SYSTEM.md`: UI/UX standards

## Common Pitfalls
1. **Don't use rate limiter on socket events** - only applied to REST routes (`rest/middleware/limiter.ts`)
2. **Socket authentication** - always check `socket.playerId` exists (injected by middleware)
3. **Room broadcasts** - use `io.to(gameCode).emit(...)` for game-wide events, `io.to(playerId).emit(...)` for private dice rolls
4. **Mock components** - files like `GameRoomMock.tsx` and `PlayerDisplayMock.tsx` are demo components, not production code
5. **Store is in-memory** - current `Store.ts` loses data on restart (needs persistent DB)

## Future Considerations
- Replace in-memory Store with MongoDB (dependencies already installed)
- Remove debug logging in `socket-builder.ts` before production deploy (lines 64-77)
- Consider adding Redis for session management with multiple server instances
