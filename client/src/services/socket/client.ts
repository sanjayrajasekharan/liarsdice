import { io } from "socket.io-client";
import { DieFace } from "shared/domain";
import {
  ActionResponse,
  ClaimPayload,
  UpdateSettingsPayload,
} from "shared/client-events";
import { ClientEvent } from "shared/events";
import { toast } from "@store/toastStore";
import { useGameState, TypedSocket } from "@store/gameStore";
import { GAME_TOKEN_KEY } from "../token";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000";
const ACK_TIMEOUT = 5000;

function handleActionResponse(response: ActionResponse): void {
  if (!response.ok) {
    toast.error(response.message);
  }
}

function getConnectedSocket(): TypedSocket | null {
  const socket = useGameState.getState().socket;
  if (!socket?.connected) {
    toast.error("Not connected to server");
    return null;
  }
  return socket;
}

export function connectSocket(): void {
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

  const socket: TypedSocket = io(WS_URL, {
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

export function disconnectSocket(): void {
  const socket = useGameState.getState().socket;
  if (socket) {
    socket.disconnect();
    useGameState.getState().setSocket(null);
    useGameState.getState().setConnected(false);
  }
}

export async function emitStartGame(): Promise<void> {
  const socket = getConnectedSocket();
  if (!socket) return;

  try {
    const response = await socket.timeout(ACK_TIMEOUT).emitWithAck(ClientEvent.START_GAME);
    handleActionResponse(response);
  } catch {
    toast.error("Request timed out");
  }
}

export async function emitClaim(quantity: number, faceValue: DieFace): Promise<void> {
  const socket = getConnectedSocket();
  if (!socket) return;

  const payload: ClaimPayload = { quantity, faceValue };

  try {
    const response = await socket.timeout(ACK_TIMEOUT).emitWithAck(ClientEvent.CLAIM, payload);
    handleActionResponse(response);
  } catch {
    toast.error("Request timed out");
  }
}

export async function emitChallenge(): Promise<void> {
  const socket = getConnectedSocket();
  if (!socket) return;

  try {
    const response = await socket.timeout(ACK_TIMEOUT).emitWithAck(ClientEvent.CHALLENGE);
    handleActionResponse(response);
  } catch {
    toast.error("Request timed out");
  }
}

export async function emitStartRound(): Promise<void> {
  const socket = getConnectedSocket();
  if (!socket) return;

  try {
    const response = await socket.timeout(ACK_TIMEOUT).emitWithAck(ClientEvent.START_ROUND);
    handleActionResponse(response);
  } catch {
    toast.error("Request timed out");
  }
}

export async function emitUpdateSettings(settings: UpdateSettingsPayload): Promise<void> {
  const socket = getConnectedSocket();
  if (!socket) return;

  try {
    const response = await socket.timeout(ACK_TIMEOUT).emitWithAck(ClientEvent.UPDATE_SETTINGS, settings);
    handleActionResponse(response);
  } catch {
    toast.error("Request timed out");
  }
}

export async function emitReorderPlayers(playerIds: string[]): Promise<void> {
  const socket = getConnectedSocket();
  if (!socket) return;

  try {
    const response = await socket.timeout(ACK_TIMEOUT).emitWithAck(ClientEvent.REORDER_PLAYERS, { playerIds });
    handleActionResponse(response);
  } catch {
    toast.error("Request timed out");
  }
}

export async function emitResetGame(): Promise<void> {
  const socket = getConnectedSocket();
  if (!socket) return;

  try {
    const response = await socket.timeout(ACK_TIMEOUT).emitWithAck(ClientEvent.RESET_GAME);
    handleActionResponse(response);
  } catch {
    toast.error("Request timed out");
  }
}

export async function emitLeaveGame(): Promise<boolean> {
  const socket = getConnectedSocket();
  if (!socket) return true;

  try {
    const response = await socket.timeout(ACK_TIMEOUT).emitWithAck(ClientEvent.LEAVE_GAME);
    if (response.ok) {
      return true;
    }
    handleActionResponse(response);
    return false;
  } catch {
    toast.error("Request timed out");
    return false;
  }
}
