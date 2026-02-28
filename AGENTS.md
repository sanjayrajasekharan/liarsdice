# Liar's Dice — Agent Instructions

## Project Overview

pnpm monorepo with three workspaces:
- `client/` — React 18 + Vite + Tailwind v4 + Zustand + Framer Motion
- `server/` — Node.js + Express + Socket.IO + Inversify DI
- `shared/` — Common TypeScript types, Zod schemas, event definitions

Communication: REST (create/join game → JWT) → WebSocket (all real-time game events).

---

## Style
Keep comments at a minimum - code should speak for itself.

---

## Build / Dev / Lint Commands

```bash
# Install all workspaces
pnpm install

# Server — hot reload on port 3000
cd server && pnpm run dev

# Client — Vite dev server on port 5173
cd client && pnpm run dev

# Build
cd server && pnpm run build   # tsc + tsc-alias → dist/
cd client && pnpm run build   # tsc -b + vite build → dist/

# Lint (client only — no server ESLint config)
cd client && pnpm run lint

# Storybook
cd client && pnpm run storybook
```

---

## Deployment (Railway)

The app is deployed to Railway as **two separate services** (monorepo root as source for both):

| Service | Config File | Build | Start |
|---|---|---|---|
| `server` | `server/railway.json` | `pnpm --filter shared build && pnpm --filter server build` | `node dist/index.js` |
| `client` | `client/railway.json` | `pnpm --filter shared build && pnpm --filter client build` | `serve dist -s -l $PORT` |

Both services use **Railpack** builder and watch `/shared/**` in addition to their own workspace.

### Railway Project Setup
1. Create a Railway project from the monorepo root
2. Add two services, each pointing to the same repo
3. Set **Root Directory** for each service: `server/` or `client/` (Railway will pick up the corresponding `railway.json`)
4. Configure environment variables (JWT_SECRET, CORS origins, etc.) per service

---

## Test Commands

The server uses **Mocha + Chai + tsx**. All tests live in `server/test/`.

```bash
# Run all server tests
cd server && pnpm run test

# Watch mode
cd server && pnpm run test:watch

# Run a single test file
cd server && pnpm exec mocha test/Game.test.ts

# Run tests matching a name pattern (--grep supports regex)
cd server && pnpm exec mocha --grep "should reject 7th player" "test/**/*.test.ts"
```

Mocha config is in `server/.mocharc.json` — TypeScript is loaded via `--node-option import=tsx`, so no pre-compilation is needed.

---

## Architecture

### Data Flow
```
Client (REST) → Server → JWT Token → Client (WebSocket) → Server
```
1. Player creates/joins game via REST → receives JWT
2. Client connects via WebSocket with `?token=...`
3. `authMiddleware` validates token, attaches `socket.playerId` / `socket.gameCode`
4. All game actions use Socket.IO events (`shared/client-events.ts` → `shared/server-events.ts`)

### Key Server Files
| File | Role |
|---|---|
| `server/src/index.ts` | DI container setup + server boot |
| `server/src/app/GameService.ts` | Pure game functions + injectable service facade |
| `server/src/app/GamesMangerService.ts` | Game creation/joining orchestration |
| `server/src/app/Store.ts` | In-memory Map of games |
| `server/src/sockets/GameController.ts` | Socket.IO event handlers (custom decorators) |
| `server/src/rest/GamesMangerController.ts` | REST endpoints |

### Key Client Files
| File | Role |
|---|---|
| `client/src/services/gameService.ts` | API calls + WebSocket wrapper + Zustand store |
| `client/src/store/toastStore.ts` | Toast notification store |
| `client/src/components/game/GameRound/GameRound.tsx` | Main game round UI |
| `client/src/components/ui/ClaimTimeline/ClaimTimeline.tsx` | Current claim + history dialog |
| `client/src/components/ui/PlayersDisplay/PlayersDisplay.tsx` | Dynamic player pills with click-to-view-claims |
| `client/src/components/ui/Toast/ToastProvider.tsx` | Toast notification system |

### Shared Protocol Files
| File | Role |
|---|---|
| `shared/client-events.ts` | `ClientToServerEvents` interface, `ActionResponse` type, `ClaimPayload` |
| `shared/server-events.ts` | `ServerToClientEvents` interface, all server payload types |
| `shared/domain.ts` | Branded IDs, game primitives, GameState, ChallengeResult |
| `shared/errors.ts` | ErrorCode enum + error messages |
| `shared/api.ts` | REST request/response schemas |

### Socket.IO Type Safety
Socket.IO is fully typed using the official pattern:
```typescript
// Server - typed socket and server
type Socket = BaseSocket<ClientToServerEvents, ServerToClientEvents>;
type Server = BaseServer<ClientToServerEvents, ServerToClientEvents>;

// Client - types are REVERSED (what I receive, what I send)
type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
```

### Request/Response Pattern
Client actions use `emitWithAck` for acknowledgements:
```typescript
// Client
const response = await socket.timeout(5000).emitWithAck('CLAIM', payload);
if (!response.ok) {
    toast.error(response.message);
}

// Server handler returns ActionResponse
handleClaim(socket, data): ActionResponse {
    if (error) return { ok: false, code: ErrorCode.INVALID_CLAIM, message: '...' };
    // ... broadcast to room ...
    return { ok: true };
}
```

---

## TypeScript & Imports

- **Strict mode** enabled in all workspaces (`"strict": true`)
- Client also enforces `noUnusedLocals` and `noUnusedParameters`
- Server requires `experimentalDecorators` and `emitDecoratorMetadata` (for Inversify + custom socket decorators)
- **ES Modules** everywhere (`"type": "module"`)
- **Server imports must include explicit `.js` extensions** even though source is `.ts`:
  ```typescript
  // ✅ CORRECT
  import { GameState } from 'shared/domain.js';
  import { ClientToServerEvents } from 'shared/client-events.js';
  import { ServerToClientEvents } from 'shared/server-events.js';

  // ❌ WRONG
  import { GameState } from 'shared/domain';
  ```
- **Client imports do NOT need `.js` extensions** (Vite handles resolution):
  ```typescript
  // ✅ CORRECT for client
  import { ClientToServerEvents } from 'shared/client-events';
  import { ServerToClientEvents } from 'shared/server-events';
  ```
- Use `async/await` exclusively — never raw Promise chains

### Path Aliases
**Server** (`@app/*`, `@game/*`, `@sockets/*`, `@rest/*`, `@auth/*`):
```typescript
import { Store } from '@app/Store.js';
```

**Client** (`@components/*`, `@pages/*`, `@services/*`, `@store/*`, `@styles/*`):
```typescript
import { Button } from '@components/Button/Button';
```

---

## Error Handling

### Game Logic — `Result<T>` Monad via `neverthrow` (NEVER throw)
```typescript
import { Result, ok, err } from 'neverthrow';

// ✅ CORRECT — return Result
function makeClaim(claim: Claim): Result<void, ErrorCode> {
    if (invalidClaim) return err(ErrorCode.INVALID_CLAIM);
    return ok(undefined);
}

// ❌ WRONG — do not throw for expected failures
function makeClaim(claim: Claim): void {
    if (invalidClaim) throw new Error("Invalid claim");
}
```

Check results with `.isErr()` / `.isOk()` methods:
```typescript
const result = addClaim(game, claim);
if (result.isErr()) return err(result.error); // propagate up
// result.value is now safely accessible
```

### Socket Layer — throw (caught by `socket-builder.ts`, returned via ack callback)
### REST Layer — return HTTP error responses (`res.status(400).json(...)`)
### Infrastructure (auth, etc.) — `try/catch` returning `null`

---

## Naming Conventions

| Context | Convention | Example |
|---|---|---|
| React components | PascalCase folder + file | `Button/Button.tsx` |
| Storybook stories | `Component.stories.tsx` co-located | `DiceRoll.stories.tsx` |
| Server domain types | PascalCase in `shared/domain.ts` | `GameState`, `Player`, `Claim` |
| Test files | `ClassName.test.ts` in `server/test/` | `test/Game.test.ts` |
| Variables / functions | camelCase | `handleJoinGame`, `makeClaim` |
| Classes / interfaces | PascalCase (no `I`-prefix) | `GameService`, `TokenPayload` |
| Enum values | `UPPER_SNAKE_CASE` | `ErrorCode.GAME_FULL`, `GameStage.PRE_GAME` |
| Event handlers | `handle*` prefix | `handleStartGame` |
| Boolean state | `is*` / `has*` prefix | `isRolling`, `hasRolledThisRound` |

---

## Testing Patterns (Mocha + Chai)

```typescript
import { expect } from 'chai';
import * as Game from '@app/GameService.js';
import { generateGameCode } from '@app/GamesMangerService.js';
import { ErrorCode } from 'shared/errors.js';
import { GameState, GameCode } from 'shared/domain.js';

describe('Game', () => {
    let game: GameState;
    let gameCode: GameCode;

    beforeEach(() => {
        gameCode = generateGameCode();
        game = Game.createGame(gameCode, 'Host');
    });

    it('should reject 7th player', () => {
        // ... add 5 more players to reach 6 total ...
        const result = Game.addPlayer(game, 'Player7');

        expect(result.isErr()).to.be.true;
        if (result.isErr()) {
            expect(result.error).to.equal(ErrorCode.GAME_FULL);
        }
    });
});
```

- BDD assertions: `expect(...).to.be.true`, `.to.equal(...)`, `.to.have.lengthOf(n)`
- Always check `result.isOk()` / `result.isErr()` before accessing `.value` or `.error`
- Use `beforeEach` for fresh game state per test — no shared mutable state

---

## UI Patterns

### Animations (Framer Motion)
- Use **opacity-only** animations to avoid horizontal scrollbar flash
- Avoid `scale`, `x`, or `y` transforms during enter/exit animations
- Add `overflow-x-hidden` to containers if transforms are necessary

### Layout
- `GameRound` uses `flex-col` with `justify-evenly` for content distribution
- Action area is `shrink-0` and pinned to bottom
- Components scale responsively (dice: `h-8 sm:h-12`, text: `text-sm sm:text-base`)

### Buttons
- All button classes include `whitespace-nowrap` to prevent text wrapping

---

## Common Pitfalls

1. **Rate limiting** — only on REST routes (`rest/middleware/limiter.ts`), never on socket events
2. **Turn validation** — always call `validateTurn(game, playerId)` before processing any player action
4. **Socket auth** — always check `socket.playerId` (injected by `authMiddleware`)
5. **Room broadcasts** — `io.to(gameCode).emit(...)` for game-wide, `io.to(playerId).emit(...)` for private (dice rolls)
6. **Store is in-memory** — `Store.ts` loses state on restart; do not assume persistence
7. **Server `.js` extensions** — server imports require `.js` extension, client imports do not
8. **Tailwind `ring-offset-*`** — extends outside element bounds and can cause overflow
