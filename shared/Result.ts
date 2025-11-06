import { GameError, ErrorCode } from './errors';

export type Result<T> = 
  | { ok: true; value: T }
  | { ok: false; error: GameError };

export function Ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

// Overload signatures
export function Err(code: ErrorCode, details?: any): Result<never>;
export function Err(error: GameError): Result<never>;

// Implementation signature
export function Err(codeOrError: ErrorCode | GameError, details?: any): Result<never> {
  if (typeof codeOrError === 'string') {
    // It's an ErrorCode
    return { 
      ok: false, 
      error: { code: codeOrError, details } 
    };
  } else {
    // It's a GameError
    return { 
      ok: false, 
      error: codeOrError 
    };
  }
}

export function isOk<T>(result: Result<T>): result is { ok: true; value: T } {
  return result.ok === true;
}

export function isErr<T>(result: Result<T>): result is { ok: false; error: GameError } {
  return result.ok === false;
}
