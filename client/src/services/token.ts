export const GAME_TOKEN_KEY = "gameToken";

export interface TokenPayload {
  playerId: string;
  gameCode: string;
  playerName: string;
  exp: number;
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getStoredToken(): { token: string; payload: TokenPayload } | null {
  const token = localStorage.getItem(GAME_TOKEN_KEY);
  if (!token) return null;
  const payload = decodeToken(token);
  if (!payload) {
    localStorage.removeItem(GAME_TOKEN_KEY);
    return null;
  }
  return { token, payload };
}

export function storeToken(token: string): void {
  localStorage.setItem(GAME_TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(GAME_TOKEN_KEY);
}
