import { z } from 'zod';


export const CreateGameRequestSchema = z.object({
  hostName: z.string().min(1, 'Host name is required').max(50, 'Host name must be 50 characters or less'),
});
export type CreateGameRequest = z.infer<typeof CreateGameRequestSchema>;


export const AddPlayerRequestSchema = z.object({
  playerName: z.string().min(1, 'Player name is required').max(50, 'Player name must be 50 characters or less'),
});
export type AddPlayerRequest = z.infer<typeof AddPlayerRequestSchema>;


export const GameCodeParamSchema = z.object({
  gameCode: z.string().min(1, 'Game code is required'),
});
export type GameCodeParam = z.infer<typeof GameCodeParamSchema>;


export const CreateGameResponseSchema = z.object({
  message: z.string(),
  gameCode: z.string(),
  playerId: z.string(),
  token: z.string(),
});
export type CreateGameResponse = z.infer<typeof CreateGameResponseSchema>;


export const AddPlayerResponseSchema = z.object({
  message: z.string(),
  gameCode: z.string(),
  playerId: z.string(),
  token: z.string(),
});
export type AddPlayerResponse = z.infer<typeof AddPlayerResponseSchema>;


export const GetGameResponseSchema = z.object({
  game: z.any(), // TODO: type this properly with GameStateSchema
});
export type GetGameResponse = z.infer<typeof GetGameResponseSchema>;


export const ErrorResponseSchema = z.object({
  error: z.string(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;


export const CheckMembershipParamsSchema = z.object({
  gameCode: z.string().min(1, 'Game code is required'),
  playerId: z.string().min(1, 'Player ID is required'),
});
export type CheckMembershipParams = z.infer<typeof CheckMembershipParamsSchema>;

export const CheckMembershipResponseSchema = z.object({
  isMember: z.boolean(),
  gameExists: z.boolean(),
});
export type CheckMembershipResponse = z.infer<typeof CheckMembershipResponseSchema>;


export const CheckJoinableResponseSchema = z.object({
  joinable: z.boolean(),
  reason: z.string().optional(),
});
export type CheckJoinableResponse = z.infer<typeof CheckJoinableResponseSchema>;
