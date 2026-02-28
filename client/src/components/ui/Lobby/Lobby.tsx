import React, { useState } from 'react';
import { motion } from "framer-motion";
import clsx from 'clsx';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { containerVariants, rowVariants, playerInfoVariants, badgeVariants } from './transitions';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isPlayer: boolean;
}

interface LobbyProps {
  players: Player[];
  onStartGame: () => void;
  onReorder?: (playerIds: string[]) => void;
  isHost?: boolean;
  maxPlayers?: number;
}

interface SortablePlayerRowProps {
  player: Player | null;
  index: number;
  isDraggable: boolean;
}

interface PlayerRowContentProps {
  player: Player;
  showDragHandle: boolean;
  isDragOverlay?: boolean;
}

const DragHandle: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5 text-text-tertiary"
  >
    <circle cx="9" cy="6" r="1.5" />
    <circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </svg>
);

const PlayerRowContent: React.FC<PlayerRowContentProps> = ({
  player,
  showDragHandle,
  isDragOverlay = false,
}) => (
  <>
    {showDragHandle && (
      <div className="mr-2">
        <DragHandle />
      </div>
    )}

    <div className="flex-1 min-h-[24px]">
      <h3 className="text-base font-medium text-text-primary">
        {player.name}
      </h3>
    </div>
    
    {player.isHost && (
      <span className={clsx("text-lg", isDragOverlay && "ml-2")}>
        👑
      </span>
    )}
  </>
);

const SortablePlayerRow: React.FC<SortablePlayerRowProps> = ({
  player,
  index,
  isDraggable,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: player?.id ?? `empty-${index}`,
    disabled: !player || !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!player) {
    return (
      <motion.div
        className={clsx(
          "flex items-center justify-between px-4 py-3 border-b border-border-light last:border-b-0",
          index % 2 !== 0 && "bg-surface-secondary"
        )}
        variants={rowVariants}
        animate="empty"
      >
        <motion.div
          className="flex-1 min-h-[24px]"
          variants={playerInfoVariants}
          initial="empty"
          animate="empty"
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "flex items-center justify-between px-4 py-3 border-b border-border-light last:border-b-0",
        index % 2 !== 0 && "bg-surface-secondary",
        isDragging && "opacity-40"
      )}
      variants={rowVariants}
      animate="show"
    >
      {isDraggable && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing mr-2 touch-none"
          aria-label="Drag to reorder"
        >
          <DragHandle />
        </div>
      )}

      <motion.div
        key={`player-${player.name}`}
        className="flex-1 min-h-[24px]"
        variants={playerInfoVariants}
        initial="hidden"
        animate="show"
      >
        <h3 className="text-base font-medium text-text-primary">
          {player.name}
        </h3>
      </motion.div>
      
      {player.isHost && (
        <motion.span
          className="text-lg"
          variants={badgeVariants}
          initial="hidden"
          animate="show"
        >
          👑
        </motion.span>
      )}
    </motion.div>
  );
};

const Lobby: React.FC<LobbyProps> = ({
  players,
  onStartGame,
  onReorder,
  isHost = false,
  maxPlayers = 6,
}) => {
  void onStartGame;
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const playerSlots = Array.from({ length: maxPlayers }, (_, index) => {
    if (index < players.length) return players[index];
    return null;
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = players.findIndex(p => p.id === active.id);
      const newIndex = players.findIndex(p => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(players, oldIndex, newIndex);
        onReorder?.(newOrder.map(p => p.id));
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const isDraggable = isHost && !!onReorder;
  const playerIds = players.map(p => p.id);
  const activePlayer = activeId ? players.find(p => p.id === activeId) : null;

  return (
    <div className="w-full max-w-md mx-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext items={playerIds} strategy={verticalListSortingStrategy}>
          <motion.div
            className="flex flex-col rounded-xl overflow-hidden border border-border-light bg-surface-elevated shadow-lg"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {playerSlots.map((player, index) => (
              <SortablePlayerRow
                key={player?.id ?? `empty-${index}`}
                player={player}
                index={index}
                isDraggable={isDraggable}
              />
            ))}
          </motion.div>
        </SortableContext>

        <DragOverlay>
          {activePlayer ? (
            <div className="flex items-center justify-between px-4 py-3 bg-surface-elevated shadow-xl rounded-lg border-2 border-primary-400">
              <PlayerRowContent
                player={activePlayer}
                showDragHandle={isDraggable}
                isDragOverlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default Lobby;
