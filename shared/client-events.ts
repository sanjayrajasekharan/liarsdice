import { z } from 'zod';
import { DieFaceSchema, GameSettingsSchema } from './domain.js';
import { ErrorCode } from './errors.js';
import { ClientEvent } from './events.js';

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

type ClientToServerEventHandlers = {
  [ClientEvent.CLAIM]: (payload: ClaimPayload, callback: (response: ActionResponse) => void) => void;
  [ClientEvent.CHALLENGE]: (callback: (response: ActionResponse) => void) => void;
  [ClientEvent.START_GAME]: (callback: (response: ActionResponse) => void) => void;
  [ClientEvent.START_ROUND]: (callback: (response: ActionResponse) => void) => void;
  [ClientEvent.UPDATE_SETTINGS]: (payload: UpdateSettingsPayload, callback: (response: ActionResponse) => void) => void;
  [ClientEvent.REORDER_PLAYERS]: (payload: ReorderPlayersPayload, callback: (response: ActionResponse) => void) => void;
  [ClientEvent.RESET_GAME]: (callback: (response: ActionResponse) => void) => void;
  [ClientEvent.LEAVE_GAME]: (callback: (response: ActionResponse) => void) => void;
};

export interface ClientToServerEvents extends ClientToServerEventHandlers {}
