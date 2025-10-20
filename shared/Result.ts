import { GameError, ErrorCode } from './errors';

export type Result<T> = 
  | { ok: true; value: T }
  | { ok: false; error: GameError };

export function Ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function Err(code: ErrorCode, message: string, details?: any): Result<never> {
  return { 
    ok: false, 
    error: { code, details } 
  };
}
