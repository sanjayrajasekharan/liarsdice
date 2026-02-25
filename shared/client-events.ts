import { z } from 'zod';
import { DieFaceSchema } from './domain';
import { ErrorCode } from './errors';

export type ActionResponse =
  | { ok: true }
  | { ok: false; code: ErrorCode; message: string };


export const ClaimPayloadSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  faceValue: DieFaceSchema,
});
export type ClaimPayload = z.infer<typeof ClaimPayloadSchema>;

export interface ClientToServerEvents {
  'CLAIM': (payload: ClaimPayload, callback: (response: ActionResponse) => void) => void;
  'CHALLENGE': (callback: (response: ActionResponse) => void) => void;
  'START_GAME': (callback: (response: ActionResponse) => void) => void;
  'START_ROUND': (callback: (response: ActionResponse) => void) => void;
}
