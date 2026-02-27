import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { diceSvgs } from "../../../assets/dice";
import { ClaimHistoryItem } from "../../../services/gameService";

interface ClaimTimelineProps {
  currentClaim: {
    playerId: string;
    playerName: string;
    quantity: number;
    faceValue: number;
  } | null;
  claimHistory: ClaimHistoryItem[];
  currentPlayerId: string | null;
}

// Animation variants
const currentClaimVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const dialogVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const ClaimTimeline: React.FC<ClaimTimelineProps> = ({
  currentClaim,
  claimHistory,
  currentPlayerId,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Previous claims (all except the current one)
  const previousClaims = claimHistory.slice(0, -1).reverse();
  const hasPreviousClaims = previousClaims.length > 0;

  if (!currentClaim && claimHistory.length === 0) {
    return
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      {/* Entire card is the trigger when there's history */}
      <Dialog.Trigger asChild disabled={hasPreviousClaims ? undefined : true}>
        <button
          type="button"
          className={clsx(
            "card overflow-x-hidden p-3 sm:p-6 w-full text-left",
            hasPreviousClaims && "cursor-pointer hover:bg-surface-secondary transition-colors duration-200"
          )}
        >
          {/* Current Claim - Compact Display */}
          <AnimatePresence mode="wait">
            {currentClaim && (
              <motion.div
                key={`${currentClaim.playerId}-${currentClaim.quantity}-${currentClaim.faceValue}`}
                className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3"
                variants={currentClaimVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Player name */}
                <span className="text-[10px] sm:text-xs text-text-secondary truncate max-w-16 sm:max-w-24">
                  {currentClaim.playerName}
                </span>

                {/* Quantity | Die display */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl font-bold text-text-primary">
                    {currentClaim.quantity}
                  </span>
                  <div className="w-px h-6 sm:h-8 bg-border-medium" />
                  <img
                    src={diceSvgs[currentClaim.faceValue]}
                    alt={`Die showing ${currentClaim.faceValue}`}
                    className="h-6 w-6 sm:h-8 sm:w-8"
                  />
                </div>

                {/* History indicator or spacer */}
                {hasPreviousClaims ? (
                  <span className="text-[10px] sm:text-xs text-text-tertiary">
                    + {previousClaims.length}
                  </span>
                ) : (
                  <span className="w-12 sm:w-16" /> // Spacer for alignment
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </Dialog.Trigger>

      {/* Dialog content */}
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/60 z-50"
                variants={overlayVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                className={clsx(
                  "fixed z-50",
                  "top-[10%] left-[5%] right-[5%] bottom-[10%]",
                  "md:top-[10%] md:left-[15%] md:right-[15%] md:bottom-[10%]",
                  "rounded-2xl shadow-2xl",
                  "bg-surface-elevated border border-border-light",
                  "flex flex-col overflow-hidden"
                )}
                variants={dialogVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-light bg-surface-secondary shrink-0">
                  <Dialog.Title className="text-base font-semibold text-text-primary">
                    Claim History
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      className={clsx(
                        "w-7 h-7 flex items-center justify-center rounded-full",
                        "text-text-secondary hover:text-text-primary",
                        "hover:bg-surface-tertiary",
                        "transition-colors duration-200 text-sm"
                      )}
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </Dialog.Close>
                </div>

                {/* Scrollable claims list */}
                <div className="flex-1 overflow-y-auto">
                  {previousClaims.map((claim) => (
                    <div
                      key={claim.claimNumber}
                      className={clsx(
                        "flex items-center justify-between px-4 py-3",
                        "border-b border-border-light last:border-b-0",
                        claim.playerId === currentPlayerId && "bg-primary-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-text-tertiary font-mono w-6">
                          #{claim.claimNumber}
                        </span>
                        <span className={clsx(
                          "text-sm font-medium truncate max-w-24",
                          claim.playerId === currentPlayerId
                            ? "text-primary-700"
                            : "text-text-primary"
                        )}>
                          {claim.playerId === currentPlayerId ? "You" : claim.playerName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-text-primary">
                          {claim.quantity}
                        </span>
                        <div className="w-px h-6 bg-border-medium" />
                        <img
                          src={diceSvgs[claim.faceValue]}
                          alt={`Die showing ${claim.faceValue}`}
                          className="h-6 w-6"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer with summary */}
                <div className="px-4 py-2 border-t border-border-light bg-surface-secondary shrink-0">
                  <p className="text-xs text-text-tertiary text-center">
                    {previousClaims.length} claim{previousClaims.length !== 1 ? 's' : ''} this round
                  </p>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};

export default ClaimTimeline;
