import { z } from 'zod';
import { DieFaceSchema, GameStateSchema, ChallengeResultSchema } from './domain';

// =============================================================================
// Server → Client Payloads (Zod schemas for runtime validation)
// =============================================================================

export const PlayerJoinedPayloadSchema = z.object({
    playerId: z.string(),
    playerName: z.string(),
});
export type PlayerJoinedPayload = z.infer<typeof PlayerJoinedPayloadSchema>;

export const PlayerLeftPayloadSchema = z.object({
    playerId: z.string(),
    newHostId: z.string().optional(),
});
export type PlayerLeftPayload = z.infer<typeof PlayerLeftPayloadSchema>;

export const GameStartedPayloadSchema = z.object({
    startingPlayerId: z.string(),
    turnDeadline: z.coerce.date(),
});
export type GameStartedPayload = z.infer<typeof GameStartedPayloadSchema>;

export const RoundStartedPayloadSchema = z.object({
    startingPlayerId: z.string(),
    turnDeadline: z.coerce.date(),
});
export type RoundStartedPayload = z.infer<typeof RoundStartedPayloadSchema>;

export const DiceRolledPayloadSchema = z.object({
    dice: z.array(DieFaceSchema),
});
export type DiceRolledPayload = z.infer<typeof DiceRolledPayloadSchema>;

export const ClaimMadePayloadSchema = z.object({
    playerId: z.string(),
    faceValue: DieFaceSchema,
    quantity: z.number().min(1),
    nextPlayerId: z.string(),
    turnDeadline: z.coerce.date(),
});
export type ClaimMadePayload = z.infer<typeof ClaimMadePayloadSchema>;

export const ChallengeMadePayloadSchema = ChallengeResultSchema;
export type ChallengeMadePayload = z.infer<typeof ChallengeMadePayloadSchema>;

export const GameEndedPayloadSchema = z.object({
    winnerId: z.string(),
});
export type GameEndedPayload = z.infer<typeof GameEndedPayloadSchema>;

export const PlayerForfeitPayloadSchema = z.object({
    playerId: z.string(),
    loserOut: z.boolean(),
    gameOver: z.boolean(),
});
export type PlayerForfeitPayload = z.infer<typeof PlayerForfeitPayloadSchema>;

export const GameStatePayloadSchema = GameStateSchema;
export type GameStatePayload = z.infer<typeof GameStatePayloadSchema>;

export const ErrorPayloadSchema = z.object({
    code: z.string(),
    message: z.string(),
});
export type ErrorPayload = z.infer<typeof ErrorPayloadSchema>;

// =============================================================================
// Server → Client Events (TypeScript interface for Socket.IO)
// =============================================================================

export interface ServerToClientEvents {
    'PLAYER_JOINED': (payload: PlayerJoinedPayload) => void;
    'PLAYER_LEFT': (payload: PlayerLeftPayload) => void;
    'PLAYER_FORFEIT': (payload: PlayerForfeitPayload) => void;
    'GAME_STARTED': (payload: GameStartedPayload) => void;
    'ROUND_STARTED': (payload: RoundStartedPayload) => void;
    'DICE_ROLLED': (payload: DiceRolledPayload) => void;
    'CLAIM_MADE': (payload: ClaimMadePayload) => void;
    'CHALLENGE_MADE': (payload: ChallengeMadePayload) => void;
    'GAME_ENDED': (payload: GameEndedPayload) => void;
    'GAME_STATE': (payload: GameStatePayload) => void;
    'ERROR': (payload: ErrorPayload) => void;
}
