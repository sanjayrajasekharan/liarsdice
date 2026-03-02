import { createApiClient } from "./api/client";
import {
  assertNoActiveSession,
  initializeSession,
  clearSession,
  startSession,
  getGameStatus,
} from "./session";
import {
  connectSocket,
  disconnectSocket,
  emitStartGame,
  emitClaim,
  emitChallenge,
  emitStartRound,
  emitUpdateSettings,
  emitReorderPlayers,
  emitResetGame,
  emitLeaveGame,
} from "./socket/client";
import {
  useGameState,
  TypedSocket,
  ClaimHistoryItem,
  GameStore,
  selectIsMyTurn,
  selectIsHost,
  selectMyPlayerInfo,
  selectCurrentPlayer,
  selectCanChallenge,
  selectCanMakeClaim,
  selectCurrentClaim,
  selectClaimHistory,
  selectChallengeResult,
  selectIsPostRoundReconnect,
  selectPlayerClaimHistory,
  selectTurnDeadline,
  selectNextRoundStartsAt,
  selectForfeitedPlayerId,
} from "@store/gameStore";

export {
  useGameState,
  selectIsMyTurn,
  selectIsHost,
  selectMyPlayerInfo,
  selectCurrentPlayer,
  selectCanChallenge,
  selectCanMakeClaim,
  selectCurrentClaim,
  selectClaimHistory,
  selectChallengeResult,
  selectIsPostRoundReconnect,
  selectPlayerClaimHistory,
  selectTurnDeadline,
  selectNextRoundStartsAt,
  selectForfeitedPlayerId,
};

export type { ClaimHistoryItem, GameStore, TypedSocket };

class GameService {
  private static api = createApiClient(import.meta.env.VITE_API_URL || "http://localhost:3000");

  static getGameCode(): string {
    return useGameState.getState().gameCode;
  }

  static async createGame(playerName: string): Promise<void> {
    await assertNoActiveSession();
    disconnectSocket();
    useGameState.getState().reset();
    const data = await this.api.createGame(playerName);
    startSession(data.token, data.playerId, data.gameCode);
  }

  static async joinGame(gameCode: string, playerName: string): Promise<void> {
    await assertNoActiveSession();
    disconnectSocket();
    useGameState.getState().reset();
    const data = await this.api.joinGame(gameCode, playerName);
    startSession(data.token, data.playerId, data.gameCode);
  }

  static connectSocket = connectSocket;
  static disconnectSocket = disconnectSocket;
  static startGame = emitStartGame;
  static makeClaim = emitClaim;
  static challenge = emitChallenge;
  static startRound = emitStartRound;
  static updateSettings = emitUpdateSettings;
  static reorderPlayers = emitReorderPlayers;
  static resetGame = emitResetGame;
  static leaveGame = emitLeaveGame;

  static initializeSession = initializeSession;
  static clearSession = clearSession;
  static getGameStatus = getGameStatus;
}

export { GameService };
