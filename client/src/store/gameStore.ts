import { create } from "zustand";
import { Socket } from "socket.io-client";
import { GameState, DieFace, ChallengeResult, Player, PlayerId } from "shared/domain";
import { ClientToServerEvents } from "shared/client-events";
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
  SettingsUpdatedPayload,
  PlayersReorderedPayload,
  GameResetPayload,
} from "shared/server-events";
import { ServerEvent } from "shared/events";
import { toast } from "@store/toastStore";

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface ClaimHistoryItem {
  playerId: string;
  playerName: string;
  quantity: number;
  faceValue: DieFace;
}

export interface GameStore {
  gameCode: string;
  playerId: string | null;
  socket: TypedSocket | null;
  isConnected: boolean;
  gameState: GameState | null;
  myDice: DieFace[];
  claimHistory: ClaimHistoryItem[];
  challengeResult: ChallengeResult | null;
  turnDeadline: Date | null;
  nextRoundStartsAt: Date | null;
  forfeitedPlayerId: string | null;
  isRolling: boolean;
  isLeaving: boolean;
  isPostRoundReconnect: boolean;
  error: string | null;

  setGameCode: (newGameCode: string) => void;
  setPlayerId: (playerId: string) => void;
  setSocket: (socket: TypedSocket | null) => void;
  setConnected: (isConnected: boolean) => void;
  setError: (error: string | null) => void;
  setIsRolling: (isRolling: boolean) => void;
  setIsLeaving: (isLeaving: boolean) => void;
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
  claimHistory: [],
  challengeResult: null,
  turnDeadline: null,
  nextRoundStartsAt: null,
  forfeitedPlayerId: null,
  isRolling: false,
  isLeaving: false,
  isPostRoundReconnect: false,
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
  setIsLeaving: (isLeaving: boolean): void => set({ isLeaving }),
  reset: (): void => set(initialState),

  handleServerEvent: (event: string, payload: unknown): void => {
    const currentState = get().gameState;

    switch (event) {
      case ServerEvent.GAME_STATE: {
        const data = payload as GameStatePayload;

        const claimHistory: ClaimHistoryItem[] = data.claims.map((claim) => {
          const player = data.players.find(p => p.id === claim.playerId);
          return {
            playerId: claim.playerId,
            playerName: player?.name ?? 'Unknown',
            quantity: claim.quantity,
            faceValue: claim.faceValue,
          };
        });

        set({
          gameState: data,
          claimHistory,
          turnDeadline: data.turnDeadline ? new Date(data.turnDeadline) : null,
        });
        break;
      }

      case ServerEvent.PLAYER_JOINED: {
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
                  remainingDice: data.remainingDice,
                  dice: [],
                }
              ]
            }
          });
        }
        break;
      }

      case ServerEvent.PLAYER_LEFT: {
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

      case ServerEvent.PLAYER_FORFEIT: {
        const data = payload as PlayerForfeitPayload;
        if (currentState) {
          const forfeitedPlayer = findPlayer(currentState.players, data.playerId);
          const playerName = forfeitedPlayer?.name ?? 'Someone';
          toast.warning(`${playerName} ran out of time!`);

          const updatedPlayers = currentState.players.map(p =>
            p.id === data.playerId
              ? { ...p, remainingDice: p.remainingDice - 1 }
              : p
          );

          let newEliminatedPlayers = currentState.eliminatedPlayers;
          if (data.loserOut) {
            newEliminatedPlayers = [...newEliminatedPlayers, data.playerId]
          }

          set({
            gameState: {
              ...currentState,
              players: updatedPlayers,
              stage: data.gameOver ? 'POST_GAME' : 'POST_ROUND',
              eliminatedPlayers: newEliminatedPlayers
            },
            turnDeadline: null,
            nextRoundStartsAt: data.nextRoundStartsAt ? new Date(data.nextRoundStartsAt) : null,
            forfeitedPlayerId: data.playerId,
            challengeResult: null,
          });
        }
        break;
      }

      case ServerEvent.GAME_STARTED: {
        const data = payload as GameStartedPayload;
        if (currentState) {
          const startingPlayerIndex = currentState.players.findIndex(p => p.id === data.startingPlayerId);
          set({
            gameState: {
              ...currentState,
              stage: 'ROUND_ROBIN',
              currentTurnIndex: startingPlayerIndex >= 0 ? startingPlayerIndex : 0
            },
            turnDeadline: new Date(data.turnDeadline),
            isRolling: true,
          });
        }
        break;
      }

      case ServerEvent.ROUND_STARTED: {
        const data = payload as RoundStartedPayload;
        if (currentState) {
          const startingPlayerIndex = currentState.players.findIndex(p => p.id === data.startingPlayerId);
          set({
            gameState: {
              ...currentState,
              stage: 'ROUND_ROBIN',
              currentTurnIndex: startingPlayerIndex >= 0 ? startingPlayerIndex : 0
            },
            claimHistory: [],
            myDice: [],
            challengeResult: null,
            turnDeadline: new Date(data.turnDeadline),
            nextRoundStartsAt: null,
            forfeitedPlayerId: null,
            isRolling: true,
            isPostRoundReconnect: false,
          });
        }
        break;
      }

      case ServerEvent.DICE_ROLLED: {
        const data = payload as DiceRolledPayload;
        set({
          myDice: data.dice,
        });
        break;
      }

      case ServerEvent.CLAIM_MADE: {
        const data = payload as ClaimMadePayload;
        if (currentState) {
          const player = findPlayer(currentState.players, data.playerId);
          const playerName = player?.name ?? 'Unknown';
          const currentHistory = get().claimHistory;
          const nextPlayerIndex = currentState.players.findIndex(p => p.id === data.nextPlayerId);
          const myPlayerId = get().playerId;
          const isMyTurn = data.nextPlayerId === myPlayerId;

          if (isMyTurn) {
            toast.info("It's your turn!");
          }

          set({
            gameState: {
              ...currentState,
              currentTurnIndex: nextPlayerIndex >= 0 ? nextPlayerIndex : 0
            },
            claimHistory: [
              ...currentHistory,
              {
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

      case ServerEvent.CHALLENGE_MADE: {
        const data = payload as ChallengeMadePayload;
        if (currentState) {
          const isReconnect = currentState.stage === 'POST_ROUND';
          const updatedPlayers = isReconnect
            ? currentState.players
            : currentState.players.map(p =>
              p.id === data.loserId
                ? { ...p, remainingDice: p.remainingDice - 1 }
                : p
            );

          if (!isReconnect) {
            const challenger = findPlayer(currentState.players, data.challengerId);
            const challengerName = challenger?.name ?? 'Someone';
            toast.info(`${challengerName} challenges!`);
          }

          let newEliminatedPlayers = currentState.eliminatedPlayers;
          if (data.loserOut) {
            newEliminatedPlayers = [...newEliminatedPlayers, data.loserId];
          }

          set({
            gameState: {
              ...currentState,
              players: updatedPlayers,
              stage: data.gameOver ? 'POST_GAME' : 'POST_ROUND',
              eliminatedPlayers: newEliminatedPlayers
            },
            challengeResult: data,
            turnDeadline: null,
            nextRoundStartsAt: data.nextRoundStartsAt ? new Date(data.nextRoundStartsAt) : null,
            forfeitedPlayerId: null,
            isPostRoundReconnect: isReconnect,
          });
        }
        break;
      }

      case ServerEvent.GAME_ENDED: {
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

      case ServerEvent.SETTINGS_UPDATED: {
        const data = payload as SettingsUpdatedPayload;
        if (currentState) {
          const updatedPlayers = currentState.players.map(p => ({
            ...p,
            remainingDice: data.startingDice,
          }));
          set({
            gameState: {
              ...currentState,
              settings: data,
              players: updatedPlayers,
            }
          });
        }
        break;
      }

      case ServerEvent.PLAYERS_REORDERED: {
        const data = payload as PlayersReorderedPayload;
        if (currentState) {
          const playerMap = new Map(currentState.players.map(p => [p.id, p]));
          const reorderedPlayers = data.playerIds
            .map(id => playerMap.get(id as PlayerId))
            .filter((p): p is Player => p !== undefined);
          set({
            gameState: {
              ...currentState,
              players: reorderedPlayers,
            }
          });
        }
        break;
      }

      case ServerEvent.GAME_RESET: {
        const data = payload as GameResetPayload;
        set({
          gameState: data,
          myDice: [],
          claimHistory: [],
          challengeResult: null,
          turnDeadline: null,
          nextRoundStartsAt: null,
          forfeitedPlayerId: null,
          isRolling: false,
          isPostRoundReconnect: false,
        });
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
  selectIsMyTurn(state) && state.claimHistory.length > 0;

export const selectCanMakeClaim = (state: GameStore): boolean =>
  selectIsMyTurn(state) && state.gameState?.stage === 'ROUND_ROBIN';

export const selectCurrentClaim = (state: GameStore): ClaimHistoryItem | null =>
  state.claimHistory.at(-1) ?? null;

export const selectClaimHistory = (state: GameStore): ClaimHistoryItem[] =>
  state.claimHistory;

export const selectChallengeResult = (state: GameStore): ChallengeResult | null =>
  state.challengeResult;

export const selectIsPostRoundReconnect = (state: GameStore): boolean =>
  state.isPostRoundReconnect;

export const selectPlayerClaimHistory = (playerId: string) => (state: GameStore): ClaimHistoryItem[] =>
  state.claimHistory.filter(claim => claim.playerId === playerId);

export const selectTurnDeadline = (state: GameStore): Date | null =>
  state.turnDeadline;

export const selectNextRoundStartsAt = (state: GameStore): Date | null =>
  state.nextRoundStartsAt;

export const selectForfeitedPlayerId = (state: GameStore): string | null =>
  state.forfeitedPlayerId;

export { useGameState };
