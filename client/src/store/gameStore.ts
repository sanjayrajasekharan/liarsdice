import { create } from "zustand";
import {Claim} from "../../../shared/actions.ts";

interface Opponent {
    name: string;
    icon: string;
    remainingDice: number;
    dice: number[];
}

interface Player {
    readonly id: string;
    readonly isHost: boolean;
    readonly name: string;
    remainingDice: number;
    dice: number[];
}

interface GameState {
    opponents: Opponent[];
    claim: Claim;
    turn: number;
    player: Player | null;
    setPlayer: (id: string, name: string, isHost: boolean) => void;
    updateClaim: (newClaim: Claim) => void;
    updateTurn: (turn: number) => void;
}

export const useGameState = create<GameState>((set) => ({
    opponents: [] as Opponent[],
    updateOpponents: (newOpponents: Opponent[]): void =>
        set({ opponents: newOpponents }),
    claim: { value: 0, quantity: 0 },
    updateClaim: (newClaim : Claim): void =>
        set({ claim: newClaim }),
    turn: 0,
    updateTurn: (newTurn: number): void => set({ turn: newTurn }),
    player: null,
    setPlayer: (id: string, name: string, isHost: boolean) =>
        set((state) => {
            if (state.player) return state;
            return {
                player: {
                    id: id,
                    isHost,
                    name,
                    remainingDice: 6,
                    dice: [],
                },
            };
        }),
}));
