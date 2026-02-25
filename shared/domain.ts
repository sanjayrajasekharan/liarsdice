import { z } from 'zod';

export const PlayerIdSchema = z.string().brand<'PlayerId'>();
export type PlayerId = z.infer<typeof PlayerIdSchema>;

export const GameCodeSchema = z.string().brand<'GameCode'>();
export type GameCode = z.infer<typeof GameCodeSchema>;

export const SocketIdSchema = z.string().brand<'SocketId'>();
export type SocketId = z.infer<typeof SocketIdSchema>;

export const DieFaceSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);
export type DieFace = z.infer<typeof DieFaceSchema>;

export const GameStageSchema = z.enum(['PRE_GAME', 'ROUND_ROBIN', 'POST_ROUND', 'POST_GAME']);
export type GameStage = z.infer<typeof GameStageSchema>;

export const GameStage = {
  PRE_GAME: 'PRE_GAME',
  ROUND_ROBIN: 'ROUND_ROBIN',
  POST_ROUND: 'POST_ROUND',
  POST_GAME: 'POST_GAME',
} as const satisfies Record<string, GameStage>;

export const PlayerInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  remainingDice: z.number(),
});
export type PlayerInfo = z.infer<typeof PlayerInfoSchema>;

export const GameStateSchema = z.object({
  gameCode: z.string(),
  hostId: z.string().optional(),
  players: z.array(PlayerInfoSchema),
  currentTurnIndex: z.number(),
  stage: GameStageSchema,
});

export type GameState = z.infer<typeof GameStateSchema>;

export const PlayerDiceCountSchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  count: z.number(),
});
export type PlayerDiceCount = z.infer<typeof PlayerDiceCountSchema>;

export const ChallengeResultSchema = z.object({
  challengerId: z.string(),
  claimerId: z.string(),
  claimedQuantity: z.number(),
  claimedFace: DieFaceSchema,
  actualTotal: z.number(),
  playerCounts: z.array(PlayerDiceCountSchema),
  winnerId: z.string(),
  loserId: z.string(),
  loserOut: z.boolean(),
  gameOver: z.boolean(),
});
export type ChallengeResult = z.infer<typeof ChallengeResultSchema>;

export const DiceArraySchema = z.array(DieFaceSchema);
export type DiceArray = z.infer<typeof DiceArraySchema>;

export const DiceMapSchema = z.record(z.string(), DiceArraySchema);
export type DiceMap = z.infer<typeof DiceMapSchema>;
