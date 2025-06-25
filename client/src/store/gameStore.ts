import { create } from "zustand";
import { GameState as BackendGameState } from "../../../shared/types";

// Frontend game store state
interface GameStoreState {
    // Connection state
    gameCode: string;
    webSocket: WebSocket | null;
    error: string | undefined;
    
    // Game state from backend
    gameState: BackendGameState | null;
    
    // Local UI state
    isRolling: boolean;
    hasRolledThisRound: boolean;
    
    // Actions
    updateGameCode: (gameCode: string) => void;
    updateWebsocket: (ws: WebSocket | null) => void;
    updateGameState: (gameState: BackendGameState) => void;
    updateError: (error: string | undefined) => void;
    setRolling: (isRolling: boolean) => void;
    setHasRolled: (hasRolled: boolean) => void;
    resetRoundState: () => void;
}

export const useGameState = create<GameStoreState>((set) => ({
    // Connection state
    error: undefined,
    gameCode: "",
    webSocket: null,
    
    // Game state
    gameState: null,
    
    // Local UI state
    isRolling: false,
    hasRolledThisRound: false,
    
    // Actions
    updateError: (error: string | undefined): void => set({ error }),
    updateGameCode: (newGameCode: string): void => set({ gameCode: newGameCode }),
    updateWebsocket: (ws: WebSocket | null): void => set({ webSocket: ws }),
    updateGameState: (gameState: BackendGameState): void => set({ gameState }),
    setRolling: (isRolling: boolean): void => set({ isRolling }),
    setHasRolled: (hasRolled: boolean): void => set({ hasRolledThisRound: hasRolled }),
    resetRoundState: (): void => set({ hasRolledThisRound: false, isRolling: false }),
}));

//debug - commented out for production

// if (typeof window !== "undefined") {
//     (window as any).useGameState = useGameState;
// }
