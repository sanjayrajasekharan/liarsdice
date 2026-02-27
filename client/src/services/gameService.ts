import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { GameState, DieFace, ChallengeResult, Player, PlayerId } from "shared/domain";
import {
  ClientToServerEvents,
  ActionResponse,
  ClaimPayload,
} from "shared/client-events";
import {
  ServerToClientEvents,
  PlayerJoinedPayload,
  PlayerLeftPayload,
  PlayerForfeitPayload,
  GameStartedPayload,
  RoundStartedPayload,
  DiceRolledPayload,
  ClaimMadePayload,
  ChallengeMadePayload,
  GameStatePayload,
} from "shared/server-events";
import {
  CreateGameResponse,
  AddPlayerResponse,
  GetGameStatusResponse,
} from "shared/api";
import { toast } from "@store/toastStore";

const GAME_TOKEN_KEY = "gameToken";

interface TokenPayload {
  playerId: string;
  gameCode: string;
  playerName: string;
  exp: number;
}

function decodeToken(token: string): TokenPayload | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function getStoredToken(): { token: string; payload: TokenPayload } | null {
  const token = localStorage.getItem(GAME_TOKEN_KEY);
  if (!token) return null;
  const payload = decodeToken(token);
  if (!payload) {
    localStorage.removeItem(GAME_TOKEN_KEY);
    return null;
  }
  return { token, payload };
}

function clearStoredToken(): void {
  localStorage.removeItem(GAME_TOKEN_KEY);
}

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface CurrentClaim {
  playerId: string;
  playerName: string;
  quantity: number;
  faceValue: DieFace;
}

export interface ClaimHistoryItem {
  claimNumber: number;
  playerId: string;
  playerName: string;
  quantity: number;
  faceValue: DieFace;
}

interface GameStore {
  gameCode: string;
  playerId: string | null;
  socket: TypedSocket | null;
  isConnected: boolean;
  gameState: GameState | null;
  myDice: DieFace[];
  currentClaim: CurrentClaim | null;
  claimHistory: ClaimHistoryItem[];
  challengeResult: ChallengeResult | null;
  turnDeadline: Date | null;
  isRolling: boolean;
  error: string | null;

  setGameCode: (newGameCode: string) => void;
  setPlayerId: (playerId: string) => void;
  setSocket: (socket: TypedSocket | null) => void;
  setConnected: (isConnected: boolean) => void;
  setError: (error: string | null) => void;
  setIsRolling: (isRolling: boolean) => void;
  handleServerEvent: (event: string, payload: unknown) => void;
  reset: () => void;
}

const initialState = {
  gameCode: "",
  playerId: null,
  socket: null,
  isConnected: false,
  gameState: null,
  myDice: [],
  currentClaim: null,
  claimHistory: [],
  challengeResult: null,
  turnDeadline: null,
  isRolling: false,
  error: null,
};

const findPlayer = (players: Player[], playerId: string): Player | undefined =>
  players.find(p => p.id === playerId);

const useGameState = create<GameStore>((set, get) => ({
  ...initialState,

  setGameCode: (newGameCode: string): void => set({ gameCode: newGameCode }),
  setPlayerId: (playerId: string): void => set({ playerId }),
  setSocket: (socket: TypedSocket | null): void => set({ socket }),
  setConnected: (isConnected: boolean): void => set({ isConnected }),
  setError: (error: string | null): void => set({ error }),
  setIsRolling: (isRolling: boolean): void => set({ isRolling }),
  reset: (): void => set(initialState),

  handleServerEvent: (event: string, payload: unknown): void => {
    const currentState = get().gameState;

    switch (event) {
      case 'GAME_STATE': {
        const data = payload as GameStatePayload;

        const claimHistory: ClaimHistoryItem[] = data.claims.map((claim, index) => {
          const player = data.players.find(p => p.id === claim.playerId);
          return {
            claimNumber: index + 1,
            playerId: claim.playerId,
            playerName: player?.name ?? 'Unknown',
            quantity: claim.quantity,
            faceValue: claim.faceValue,
          };
        });

        const lastClaim = data.claims[data.claims.length - 1];
        let currentClaim: CurrentClaim | null = null;
        if (lastClaim) {
          const player = data.players.find(p => p.id === lastClaim.playerId);
          currentClaim = {
            playerId: lastClaim.playerId,
            playerName: player?.name ?? 'Unknown',
            quantity: lastClaim.quantity,
            faceValue: lastClaim.faceValue,
          };
        }

        set({
          gameState: data,
          claimHistory,
          currentClaim,
          turnDeadline: data.turnDeadline ? new Date(data.turnDeadline) : null,
        });
        break;
      }

      case 'PLAYER_JOINED': {
        const data = payload as PlayerJoinedPayload;
        if (currentState) {
          const playerExists = currentState.players.some(p => p.id === data.playerId);
          if (playerExists) break;

          set({
            gameState: {
              ...currentState,
              players: [
                ...currentState.players,
                {
                  id: data.playerId as PlayerId,
                  name: data.playerName,
                  remainingDice: 5,
                  dice: [],
                }
              ]
            }
          });
        }
        break;
      }

      case 'PLAYER_LEFT': {
        const data = payload as PlayerLeftPayload;
        if (currentState) {
          set({
            gameState: {
              ...currentState,
              players: currentState.players.filter(p => p.id !== data.playerId),
              hostId: (data.newHostId as PlayerId) ?? currentState.hostId,
            }
          });
        }
        break;
      }

      case 'PLAYER_FORFEIT': {
        const data = payload as PlayerForfeitPayload;
        if (currentState) {
          let updatedPlayers = currentState.players.map(p =>
            p.id === data.playerId
              ? { ...p, remainingDice: p.remainingDice - 1 }
              : p
          );

          if (data.loserOut) {
            updatedPlayers = updatedPlayers.filter(p => p.id !== data.playerId);
          }

          set({
            gameState: {
              ...currentState,
              players: updatedPlayers,
              stage: data.gameOver ? 'POST_GAME' : 'POST_ROUND',
            },
          });
        }
        break;
      }

      case 'GAME_STARTED': {
        const data = payload as GameStartedPayload;
        if (currentState) {
          const startingPlayerIndex = currentState.players.findIndex(p => p.id === data.startingPlayerId);
          set({
            gameState: {
              ...currentState,
              stage: 'ROUND_ROBIN',
              currentTurnIndex: startingPlayerIndex >= 0 ? startingPlayerIndex : 0
            },
            currentClaim: null,
            turnDeadline: new Date(data.turnDeadline),
            isRolling: true,
          });
        }
        break;
      }

      case 'ROUND_STARTED': {
        const data = payload as RoundStartedPayload;
        if (currentState) {
          const startingPlayerIndex = currentState.players.findIndex(p => p.id === data.startingPlayerId);
          set({
            gameState: {
              ...currentState,
              stage: 'ROUND_ROBIN',
              currentTurnIndex: startingPlayerIndex >= 0 ? startingPlayerIndex : 0
            },
            currentClaim: null,
            claimHistory: [],
            myDice: [],
            challengeResult: null,
            turnDeadline: new Date(data.turnDeadline),
            isRolling: true,
          });

          // set a timeout to end the rolling state after a short delay (e.g., 2 seconds)


        }
        break;
      }

      case 'DICE_ROLLED': {
        const data = payload as DiceRolledPayload;
        set({
          myDice: data.dice,
        });
        break;
      }

      case 'CLAIM_MADE': {
        const data = payload as ClaimMadePayload;
        if (currentState) {
          const player = findPlayer(currentState.players, data.playerId);
          const playerName = player?.name ?? 'Unknown';
          const currentHistory = get().claimHistory;
          const newClaimNumber = currentHistory.length + 1;
          const nextPlayerIndex = currentState.players.findIndex(p => p.id === data.nextPlayerId);

          set({
            gameState: {
              ...currentState,
              currentTurnIndex: nextPlayerIndex >= 0 ? nextPlayerIndex : 0
            },
            currentClaim: {
              playerId: data.playerId,
              playerName,
              quantity: data.quantity,
              faceValue: data.faceValue,
            },
            claimHistory: [
              ...currentHistory,
              {
                claimNumber: newClaimNumber,
                playerId: data.playerId,
                playerName,
                quantity: data.quantity,
                faceValue: data.faceValue,
              }
            ],
            turnDeadline: new Date(data.turnDeadline),
          });
        }
        break;
      }

      case 'CHALLENGE_MADE': {
        const data = payload as ChallengeMadePayload;
        if (currentState) {
          const updatedPlayers = currentState.players.map(p =>
            p.id === data.loserId
              ? { ...p, remainingDice: p.remainingDice - 1 }
              : p
          );

          set({
            gameState: {
              ...currentState,
              players: updatedPlayers,
              stage: data.gameOver ? 'POST_GAME' : 'POST_ROUND'
            },
            challengeResult: data,
            turnDeadline: null,
          });
        }
        break;
      }

      case 'GAME_ENDED': {
        if (currentState) {
          set({
            gameState: {
              ...currentState,
              stage: 'POST_GAME'
            }
          });
        }
        break;
      }
    }
  },
}));

// Selectors
export const selectIsMyTurn = (state: GameStore): boolean => {
  if (!state.playerId || !state.gameState) return false;
  const currentPlayer = state.gameState.players[state.gameState.currentTurnIndex];
  return currentPlayer?.id === state.playerId;
};

export const selectIsHost = (state: GameStore): boolean =>
  state.playerId !== null && state.gameState?.hostId === state.playerId;

export const selectMyPlayerInfo = (state: GameStore): Player | null => {
  if (!state.playerId || !state.gameState) return null;
  return findPlayer(state.gameState.players, state.playerId) ?? null;
};

export const selectCurrentPlayer = (state: GameStore): Player | null => {
  if (!state.gameState) return null;
  return state.gameState.players[state.gameState.currentTurnIndex] ?? null;
};

export const selectCanChallenge = (state: GameStore): boolean =>
  selectIsMyTurn(state) && state.currentClaim !== null;

export const selectCanMakeClaim = (state: GameStore): boolean =>
  selectIsMyTurn(state) && state.gameState?.stage === 'ROUND_ROBIN';

export const selectClaimHistory = (state: GameStore): ClaimHistoryItem[] =>
  state.claimHistory;

export const selectChallengeResult = (state: GameStore): ChallengeResult | null =>
  state.challengeResult;

export const selectPlayerClaimHistory = (playerId: string) => (state: GameStore): ClaimHistoryItem[] =>
  state.claimHistory.filter(claim => claim.playerId === playerId);

export const selectTurnDeadline = (state: GameStore): Date | null =>
  state.turnDeadline;

// API client
const createApiClient = (baseUrl: string) => ({
  async createGame(hostName: string): Promise<CreateGameResponse> {
    const response = await fetch(`${baseUrl}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create game');
    }
    return response.json();
  },

  async joinGame(gameCode: string, playerName: string): Promise<AddPlayerResponse> {
    const response = await fetch(`${baseUrl}/api/games/${gameCode}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join game');
    }
    return response.json();
  },

  async getGameStatus(gameCode: string, playerId?: string): Promise<GetGameStatusResponse> {
    const url = playerId
      ? `${baseUrl}/api/games/${gameCode}?playerId=${playerId}`
      : `${baseUrl}/api/games/${gameCode}`;
    const response = await fetch(url);
    if (!response.ok) {
      return { exists: false, joinable: false };
    }
    return response.json();
  },
});

const ACK_TIMEOUT = 5000;

class GameService {
  private static wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:3000";
  private static api = createApiClient(import.meta.env.VITE_API_URL || "http://localhost:3000");

  private static handleActionResponse(response: ActionResponse): void {
    if (!response.ok) {
      toast.error(response.message);
    }
  }

  static getGameCode(): string {
    return useGameState.getState().gameCode;
  }

  private static async assertNoActiveSession(): Promise<void> {
    const stored = getStoredToken();
    if (!stored) return;

    const status = await this.api.getGameStatus(
      stored.payload.gameCode,
      stored.payload.playerId
    );

    if (status.exists && status.isMember) {
      throw new Error('You are already in a game. Leave your current game first.');
    }

    clearStoredToken();
  }

  static async createGame(playerName: string): Promise<void> {
    await this.assertNoActiveSession();
    this.disconnectSocket();
    useGameState.getState().reset();
    const data = await this.api.createGame(playerName);
    localStorage.setItem(GAME_TOKEN_KEY, data.token);
    useGameState.getState().setPlayerId(data.playerId);
    useGameState.getState().setGameCode(data.gameCode);
  }

  static async joinGame(gameCode: string, playerName: string): Promise<void> {
    await this.assertNoActiveSession();
    this.disconnectSocket();
    useGameState.getState().reset();
    const data = await this.api.joinGame(gameCode, playerName);
    localStorage.setItem(GAME_TOKEN_KEY, data.token);
    useGameState.getState().setPlayerId(data.playerId);
    useGameState.getState().setGameCode(data.gameCode);
  }

  static connectSocket(): void {
    const { gameCode, socket: existingSocket } = useGameState.getState();
    const token = localStorage.getItem(GAME_TOKEN_KEY);

    if (!gameCode || !token) {
      useGameState.getState().setError("Game code or token is missing");
      return;
    }

    if (existingSocket) {
      if (!existingSocket.connected) {
        existingSocket.connect();
      }
      return;
    }

    const socket: TypedSocket = io(this.wsUrl, {
      query: { token },
    });

    socket.on("connect", () => {
      console.log("Connected to game server");
      useGameState.getState().setConnected(true);
      useGameState.getState().setError(null);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from game server");
      useGameState.getState().setConnected(false);
    });

    socket.on("ERROR", (error) => {
      console.error("Socket error:", error);
      toast.error(error.message);
    });

    socket.onAny((event: string, payload: unknown) => {
      useGameState.getState().handleServerEvent(event, payload);
    });

    useGameState.getState().setSocket(socket);
  }

  static disconnectSocket(): void {
    const socket = useGameState.getState().socket;
    if (socket) {
      socket.disconnect();
      useGameState.getState().setSocket(null);
      useGameState.getState().setConnected(false);
    }
  }

  static async startGame(): Promise<void> {
    const socket = useGameState.getState().socket;
    if (!socket?.connected) {
      toast.error("Not connected to server");
      return;
    }

    try {
      const response = await socket.timeout(ACK_TIMEOUT).emitWithAck('START_GAME');
      this.handleActionResponse(response);
    } catch {
      toast.error("Request timed out");
    }
  }

  static async makeClaim(quantity: number, faceValue: DieFace): Promise<void> {
    const socket = useGameState.getState().socket;
    if (!socket?.connected) {
      toast.error("Not connected to server");
      return;
    }

    const payload: ClaimPayload = { quantity, faceValue };

    try {
      const response = await socket.timeout(ACK_TIMEOUT).emitWithAck('CLAIM', payload);
      this.handleActionResponse(response);
    } catch {
      toast.error("Request timed out");
    }
  }

  static async challenge(): Promise<void> {
    const socket = useGameState.getState().socket;
    if (!socket?.connected) {
      toast.error("Not connected to server");
      return;
    }

    try {
      const response = await socket.timeout(ACK_TIMEOUT).emitWithAck('CHALLENGE');
      this.handleActionResponse(response);
    } catch {
      toast.error("Request timed out");
    }
  }

  static async startRound(): Promise<void> {
    const socket = useGameState.getState().socket;
    if (!socket?.connected) {
      toast.error("Not connected to server");
      return;
    }

    try {
      const response = await socket.timeout(ACK_TIMEOUT).emitWithAck('START_ROUND');
      this.handleActionResponse(response);
    } catch {
      toast.error("Request timed out");
    }
  }

  static async initializeSession(): Promise<{ gameCode: string } | null> {
    const stored = getStoredToken();
    if (!stored) return null;

    const { payload } = stored;
    const status = await this.api.getGameStatus(payload.gameCode, payload.playerId);

    if (!status.exists || !status.isMember) {
      clearStoredToken();
      return null;
    }

    useGameState.getState().setPlayerId(payload.playerId);
    useGameState.getState().setGameCode(payload.gameCode);
    return { gameCode: payload.gameCode };
  }

  static clearSession(): void {
    this.disconnectSocket();
    clearStoredToken();
    useGameState.getState().reset();
  }

  static async getGameStatus(gameCode: string): Promise<GetGameStatusResponse> {
    return this.api.getGameStatus(gameCode);
  }
}

export { GameService, useGameState };
