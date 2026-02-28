import { z } from 'zod';
import { DieFaceSchema, GameSettingsSchema } from './domain.js';
import { ErrorCode } from './errors.js';

export type ActionResponse =
  | { ok: true }
  | { ok: false; code: ErrorCode; message: string };


export const ClaimPayloadSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  faceValue: DieFaceSchema,
});
export type ClaimPayload = z.infer<typeof ClaimPayloadSchema>;

export const UpdateSettingsPayloadSchema = GameSettingsSchema.partial();
export type UpdateSettingsPayload = z.infer<typeof UpdateSettingsPayloadSchema>;

export const ReorderPlayersPayloadSchema = z.object({
  playerIds: z.array(z.string()),
});
export type ReorderPlayersPayload = z.infer<typeof ReorderPlayersPayloadSchema>;

export interface ClientToServerEvents {
  'CLAIM': (payload: ClaimPayload, callback: (response: ActionResponse) => void) => void;
  'CHALLENGE': (callback: (response: ActionResponse) => void) => void;
  'START_GAME': (callback: (response: ActionResponse) => void) => void;
  'START_ROUND': (callback: (response: ActionResponse) => void) => void;
  'UPDATE_SETTINGS': (payload: UpdateSettingsPayload, callback: (response: ActionResponse) => void) => void;
  'REORDER_PLAYERS': (payload: ReorderPlayersPayload, callback: (response: ActionResponse) => void) => void;
  'RESET_GAME': (callback: (response: ActionResponse) => void) => void;
  'LEAVE_GAME': (callback: (response: ActionResponse) => void) => void;
}
