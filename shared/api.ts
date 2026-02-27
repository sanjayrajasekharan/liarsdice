import { z } from 'zod';
import { GameStateSchema } from './domain';


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


export const GetGameStatusResponseSchema = z.object({
  exists: z.boolean(),
  joinable: z.boolean(),
  reason: z.string().optional(),
  isMember: z.boolean().optional(),
  game: GameStateSchema.optional(),
});
export type GetGameStatusResponse = z.infer<typeof GetGameStatusResponseSchema>;


export const ErrorResponseSchema = z.object({
  error: z.string(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
