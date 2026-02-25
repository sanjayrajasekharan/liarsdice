import { create } from "zustand";

export type ToastVariant = "info" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number; // ms, default 4000
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

let toastId = 0;
const generateId = () => `toast-${++toastId}`;

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = generateId();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));

// Convenience functions for use outside React components
export const toast = {
  info: (title: string, description?: string, duration?: number) =>
    useToastStore.getState().addToast({ title, description, variant: "info", duration }),
  
  success: (title: string, description?: string, duration?: number) =>
    useToastStore.getState().addToast({ title, description, variant: "success", duration }),
  
  warning: (title: string, description?: string, duration?: number) =>
    useToastStore.getState().addToast({ title, description, variant: "warning", duration }),
  
  error: (title: string, description?: string, duration?: number) =>
    useToastStore.getState().addToast({ title, description, variant: "error", duration }),
};

export default useToastStore;
