import React from "react";
import * as RadixToast from "@radix-ui/react-toast";
import clsx from "clsx";
import useToastStore, { Toast, ToastVariant } from "../../../store/toastStore";

const DEFAULT_DURATION = 2000;

const variantStyles: Record<ToastVariant, { bg: string; border: string; icon: string }> = {
  info: {
    bg: "bg-surface-elevated",
    border: "border-primary-500/30",
    icon: "🛈",
  },
  success: {
    bg: "bg-surface-elevated",
    border: "border-green-500/30",
    icon: "✓",
  },
  warning: {
    bg: "bg-surface-elevated",
    border: "border-yellow-500/30",
    icon: "⚠",
  },
  error: {
    bg: "bg-surface-elevated",
    border: "border-red-500/30",
    icon: "✕",
  },
};

const iconColorStyles: Record<ToastVariant, string> = {
  info: "text-primary-500",
  success: "text-green-500",
  warning: "text-yellow-500",
  error: "text-red-500",
};

interface ToastItemProps {
  toast: Toast;
  onOpenChange: (open: boolean) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onOpenChange }) => {
  const styles = variantStyles[toast.variant];
  const iconColor = iconColorStyles[toast.variant];
  const hasDescription = Boolean(toast.description);

  return (
    <RadixToast.Root
      duration={toast.duration ?? DEFAULT_DURATION}
      onOpenChange={onOpenChange}
      className={clsx(
        "ToastRoot",
        "rounded-xl shadow-lg border p-4",
        "flex gap-3",
        hasDescription ? "items-start" : "items-center",
        styles.bg,
        styles.border,
      )}
    >
      {/* Icon */}
      <span className={clsx("text-lg shrink-0", iconColor)}>
        {styles.icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <RadixToast.Title className="text-sm font-semibold text-text-primary">
          {toast.title}
        </RadixToast.Title>
        {toast.description && (
          <RadixToast.Description className="text-sm text-text-secondary mt-1">
            {toast.description}
          </RadixToast.Description>
        )}
      </div>

      {/* Close button */}
      <RadixToast.Close asChild>
        <button
          className={clsx(
            "shrink-0 w-6 h-6 rounded-full",
            "flex items-center justify-center",
            "text-text-tertiary hover:text-text-primary",
            "hover:bg-surface-secondary",
            "transition-colors duration-150"
          )}
          aria-label="Close"
        >
          ✕
        </button>
      </RadixToast.Close>
    </RadixToast.Root>
  );
};

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <RadixToast.Provider swipeDirection="right">
      {children}

      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onOpenChange={(open) => {
            if (!open) removeToast(toast.id);
          }}
        />
      ))}

      <RadixToast.Viewport
        className={clsx(
          "fixed bottom-0 right-0 z-[100]",
          "flex flex-col gap-2 p-4",
          "w-full max-w-sm",
          "outline-none"
        )}
      />
    </RadixToast.Provider>
  );
};

export default ToastProvider;
