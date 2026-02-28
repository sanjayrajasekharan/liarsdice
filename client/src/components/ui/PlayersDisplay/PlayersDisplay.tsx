import React, { useState, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import clsx from "clsx";
import PlayerClaimsPopover from "../PlayerClaimsPopover/PlayerClaimsPopover";
import {
  useGameState,
  selectClaimHistory,
  selectCurrentPlayer,
  ClaimHistoryItem,
} from "../../../services/gameService";

interface PlayersDisplayProps {
  onPlayerClick?: (playerId: string) => void;
  showEliminated?: boolean;
  maxRows?: number;
}

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

const GAP = 8;
const PADDING = 8;
const MIN_PILL_WIDTH = 64;
const MAX_PILL_WIDTH = 120;

interface PlayerPillProps {
  playerId: string;
  playerName: string;
  diceCount: number;
  isCurrentTurn: boolean;
  isUser: boolean;
  claims: ClaimHistoryItem[];
  pillWidth: number;
  onPlayerClick?: (playerId: string) => void;
}

const PlayerPill: React.FC<PlayerPillProps> = ({
  playerId,
  playerName,
  diceCount,
  isCurrentTurn,
  isUser,
  claims,
  pillWidth,
  onPlayerClick,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const isCompact = pillWidth < 80;

  const pillContent = (
    <motion.button
      className={clsx(
        "relative flex flex-col items-center rounded-xl",
        isCompact ? "gap-0.5 px-2 py-2" : "gap-1 px-3 py-2.5",
        "border-2 border-border-light transition-colors duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        isCurrentTurn && "border-primary-500 bg-primary-50 shadow-md",
        "cursor-pointer hover:shadow-md"
      )}
      style={{ width: pillWidth }}
      onClick={() => {
        onPlayerClick?.(playerId);
        setIsPopoverOpen(prev => !prev);
      }}
      variants={playerPillVariants}
      layout
      layoutId={`player-${playerId}`}
    >
      <AnimatePresence>
        {isCurrentTurn && (
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

      <span className={clsx(
        "font-medium truncate w-full text-center text-text-primary",
        isCompact ? "text-xs" : "text-sm"
      )}>
        {isUser ? "You" : playerName}
      </span>

      <motion.span
        className={clsx(
          "flex items-center justify-center font-bold rounded-full",
          "bg-neutral-200 text-text-primary",
          isCompact ? "w-5 h-5 text-xs" : "w-6 h-6 text-sm"
        )}
        key={diceCount}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
      >
        {diceCount}
      </motion.span>
    </motion.button>
  );

  return (
    <div className="flex flex-col items-center gap-1">
      <PlayerClaimsPopover
        playerName={isUser ? "Your" : playerName}
        claims={claims}
        isOpen={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
      >
        {pillContent}
      </PlayerClaimsPopover>
    </div>
  );
};

const PlayersDisplay: React.FC<PlayersDisplayProps> = ({
  onPlayerClick,
  showEliminated = false,
  maxRows = 2,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pillWidth, setPillWidth] = useState(MIN_PILL_WIDTH);

  const players = useGameState(state => state.gameState?.players ?? []);
  const currentPlayer = useGameState(selectCurrentPlayer);
  const playerId = useGameState(state => state.playerId);
  const claimHistory = useGameState(selectClaimHistory);

  const visiblePlayers = showEliminated
    ? players
    : players.filter(p => p.remainingDice > 0);

  const playerCount = visiblePlayers.length;

  useLayoutEffect(() => {
    const calculatePillWidth = () => {
      if (!containerRef.current || playerCount === 0) return;

      const containerWidth = containerRef.current.offsetWidth - (PADDING * 2);
      const pillsPerRow = Math.ceil(playerCount / maxRows);
      const totalGapWidth = (pillsPerRow - 1) * GAP;
      const availableWidth = containerWidth - totalGapWidth;
      const calculatedWidth = Math.floor(availableWidth / pillsPerRow);
      const clampedWidth = Math.max(MIN_PILL_WIDTH, Math.min(MAX_PILL_WIDTH, calculatedWidth));
      setPillWidth(clampedWidth);
    };

    calculatePillWidth();

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
                playerId={player.id}
                playerName={player.name}
                diceCount={player.remainingDice}
                isCurrentTurn={player.id === currentPlayer?.id}
                isUser={player.id === playerId}
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
