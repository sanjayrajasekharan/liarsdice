import React, { useState, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import clsx from "clsx";
import PlayerClaimsPopover from "../PlayerClaimsPopover/PlayerClaimsPopover";
import { ClaimHistoryItem } from "../../../services/gameService";

export interface Player {
  id: string;
  name: string;
  diceCount: number;
  isCurrentTurn?: boolean;
  isUser?: boolean;
}

interface PlayersDisplayProps {
  players: Player[];
  claimHistory?: ClaimHistoryItem[];
  onPlayerClick?: (playerId: string) => void;
  showEliminated?: boolean; // Default false - hide eliminated players
  maxRows?: number; // Default 2 - max rows of pills
}

// Animation variants
const containerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    }
  }
};

const playerPillVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Turn indicator ring animation
const turnIndicatorVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

const GAP = 8; // gap-2 = 8px
const PADDING = 8; // p-2 = 8px each side
const MIN_PILL_WIDTH = 64; // Minimum pill width
const MAX_PILL_WIDTH = 120; // Maximum pill width

interface PlayerPillProps {
  player: Player;
  claims: ClaimHistoryItem[];
  pillWidth: number;
  onPlayerClick?: (playerId: string) => void;
}

const PlayerPill: React.FC<PlayerPillProps> = ({ player, claims, pillWidth, onPlayerClick }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const isCompact = pillWidth < 80;

  const pillContent = (
    <motion.button
      className={clsx(
        "relative flex flex-col items-center rounded-xl",
        isCompact ? "gap-0.5 px-2 py-2" : "gap-1 px-3 py-2.5",
        "border-2 border-border-light transition-colors duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        player.isCurrentTurn && "border-primary-500 bg-primary-50 shadow-md",
        "cursor-pointer hover:shadow-md"
      )}
      style={{ width: pillWidth }}
      onClick={() => {
        onPlayerClick?.(player.id);
        setIsPopoverOpen(prev => !prev);
      }}
      variants={playerPillVariants}
      layout
      layoutId={`player-${player.id}`}
    >
      <AnimatePresence>
        {player.isCurrentTurn && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-primary-500/10"
            variants={turnIndicatorVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            layoutId="turn-indicator"
          />
        )}
      </AnimatePresence>

      {/* Player name - truncated with ellipsis */}
      <span className={clsx(
        "font-medium truncate w-full text-center text-text-primary",
        isCompact ? "text-xs" : "text-sm"
      )}>
        {player.isUser ? "You" : player.name}
      </span>

      {/* Dice count badge */}
      <motion.span
        className={clsx(
          "flex items-center justify-center font-bold rounded-full",
          "bg-neutral-200 text-text-primary",
          isCompact ? "w-5 h-5 text-xs" : "w-6 h-6 text-sm"
        )}
        key={player.diceCount}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
      >
        {player.diceCount}
      </motion.span>
    </motion.button>
  );

  return (
    <PlayerClaimsPopover
      playerName={player.isUser ? "Your" : player.name}
      claims={claims}
      isOpen={isPopoverOpen}
      onOpenChange={setIsPopoverOpen}
    >
      {pillContent}
    </PlayerClaimsPopover>
  );
};

const PlayersDisplay: React.FC<PlayersDisplayProps> = ({
  players,
  claimHistory = [],
  onPlayerClick,
  showEliminated = false,
  maxRows = 2,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pillWidth, setPillWidth] = useState(MIN_PILL_WIDTH);

  // Filter out eliminated players unless showEliminated is true
  const visiblePlayers = showEliminated
    ? players
    : players.filter(p => p.diceCount > 0);

  const playerCount = visiblePlayers.length;

  // Calculate optimal pill width based on container width and player count
  useLayoutEffect(() => {
    const calculatePillWidth = () => {
      if (!containerRef.current || playerCount === 0) return;

      const containerWidth = containerRef.current.offsetWidth - (PADDING * 2);

      // Calculate pills per row to fit in maxRows
      const pillsPerRow = Math.ceil(playerCount / maxRows);

      // Calculate available width per pill (accounting for gaps)
      const totalGapWidth = (pillsPerRow - 1) * GAP;
      const availableWidth = containerWidth - totalGapWidth;
      const calculatedWidth = Math.floor(availableWidth / pillsPerRow);

      // Clamp between min and max
      const clampedWidth = Math.max(MIN_PILL_WIDTH, Math.min(MAX_PILL_WIDTH, calculatedWidth));
      setPillWidth(clampedWidth);
    };

    calculatePillWidth();

    // Recalculate on resize
    const resizeObserver = new ResizeObserver(calculatePillWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [playerCount, maxRows]);

  return (
    <LayoutGroup>
      <motion.div
        ref={containerRef}
        className="flex flex-wrap items-center justify-center gap-2 p-2 overflow-hidden"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <AnimatePresence mode="popLayout">
          {visiblePlayers.map((player) => {
            const playerClaims = claimHistory.filter(c => c.playerId === player.id);

            return (
              <PlayerPill
                key={player.id}
                player={player}
                claims={playerClaims}
                pillWidth={pillWidth}
                onPlayerClick={onPlayerClick}
              />
            );
          })}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );
};

export default PlayersDisplay;
