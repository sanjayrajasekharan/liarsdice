// =============================================================================
// Domain Types
// =============================================================================
export {
  PlayerIdSchema,
  GameCodeSchema,
  SocketIdSchema,
  type PlayerId,
  type GameCode,
  type SocketId,

  DieFaceSchema,
  GameStageSchema,
  GameStage,
  type DieFace,

  PlayerSchema,
  ClaimSchema,
  GameStateSchema,
  PlayerDiceCountSchema,
  ChallengeResultSchema,
  DiceArraySchema,
  DiceMapSchema,
  type Player,
  type Claim,
  type GameState,
  type PlayerDiceCount,
  type ChallengeResult,
  type DiceArray,
  type DiceMap,
} from './domain.js';

// =============================================================================
// Client → Server Events
// =============================================================================
export {
  ClaimPayloadSchema,
  type ClaimPayload,
  type ActionResponse,
  type ClientToServerEvents,
} from './client-events.js';

// =============================================================================
// Server → Client Events
// =============================================================================
export {
  PlayerJoinedPayloadSchema,
  PlayerLeftPayloadSchema,
  GameStartedPayloadSchema,
  RoundStartedPayloadSchema,
  DiceRolledPayloadSchema,
  ClaimMadePayloadSchema,
  ChallengeMadePayloadSchema,
  GameEndedPayloadSchema,
  GameStatePayloadSchema,
  ErrorPayloadSchema,
  type PlayerJoinedPayload,
  type PlayerLeftPayload,
  type GameStartedPayload,
  type RoundStartedPayload,
  type DiceRolledPayload,
  type ClaimMadePayload,
  type ChallengeMadePayload,
  type GameEndedPayload,
  type GameStatePayload,
  type ErrorPayload,
  type ServerToClientEvents,
} from './server-events.js';

// =============================================================================
// Errors
// =============================================================================
export {
  ErrorCode,
  errorMessages,
  getErrorMessage,
} from './errors.js';

// =============================================================================
// REST API
// =============================================================================
export {
  CreateGameRequestSchema,
  AddPlayerRequestSchema,
  GameCodeParamSchema,
  type CreateGameRequest,
  type AddPlayerRequest,
  type GameCodeParam,

  CreateGameResponseSchema,
  AddPlayerResponseSchema,
  GetGameStatusResponseSchema,
  ErrorResponseSchema,
  type CreateGameResponse,
  type AddPlayerResponse,
  type GetGameStatusResponse,
  type ErrorResponse,
} from './api.js';
