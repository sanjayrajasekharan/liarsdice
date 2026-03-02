import { GetGameStatusResponse } from "shared/api";
import { getStoredToken, storeToken, clearStoredToken } from "./token";
import { disconnectSocket } from "./socket/client";
import { useGameState } from "@store/gameStore";
import { createApiClient } from "./api/client";

const api = createApiClient(import.meta.env.VITE_API_URL || "http://localhost:3000");

export async function assertNoActiveSession(): Promise<void> {
  const stored = getStoredToken();
  if (!stored) return;

  const status = await api.getGameStatus(
    stored.payload.gameCode,
    stored.payload.playerId
  );

  if (status.exists && status.isMember) {
    throw new Error('You are already in a game. Leave your current game first.');
  }

  clearStoredToken();
}

export async function initializeSession(): Promise<{ gameCode: string } | null> {
  const stored = getStoredToken();
  if (!stored) return null;

  const { payload } = stored;
  const status = await api.getGameStatus(payload.gameCode, payload.playerId);

  if (!status.exists || !status.isMember) {
    clearStoredToken();
    return null;
  }

  useGameState.getState().setPlayerId(payload.playerId);
  useGameState.getState().setGameCode(payload.gameCode);
  return { gameCode: payload.gameCode };
}

export function clearSession(): void {
  disconnectSocket();
  clearStoredToken();
  useGameState.getState().reset();
}

export function startSession(token: string, playerId: string, gameCode: string): void {
  storeToken(token);
  useGameState.getState().setPlayerId(playerId);
  useGameState.getState().setGameCode(gameCode);
}

export async function getGameStatus(gameCode: string): Promise<GetGameStatusResponse> {
  return api.getGameStatus(gameCode);
}
