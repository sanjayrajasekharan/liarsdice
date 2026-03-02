import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { GameService, useGameState } from '@services/gameService';

const LeaveGame: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const setIsLeaving = useGameState(state => state.setIsLeaving);

  const handleLeave = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLeaving(true);
    const success = await GameService.leaveGame();
    setIsOpen(false);
    if (success) {
      navigate('/');
      GameService.clearSession();
    }
  };

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialog.Trigger asChild>
        <button
          className="p-1.5 rounded-md hover:bg-surface-secondary transition-colors text-text-secondary hover:text-text-primary"
          title="Leave game"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" />
            <polyline points="18 17 23 12 18 7" />
            <line x1="23" y1="12" x2="10" y2="12" />
          </svg>
        </button>
      </AlertDialog.Trigger>

      <AnimatePresence>
        {isOpen && (
          <AlertDialog.Portal forceMount>
            <AlertDialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-surface-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </AlertDialog.Overlay>
            <AlertDialog.Content asChild forceMount>
              <motion.div
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-elevated rounded-xl p-6 shadow-xl w-[90vw] max-w-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <AlertDialog.Title className="text-lg font-semibold text-text-primary">
                  Leave Game?
                </AlertDialog.Title>
                <AlertDialog.Description className="mt-2 text-sm text-text-secondary">
                  Are you sure you want to leave? If the game is in progress, you will be eliminated.
                </AlertDialog.Description>

                <div className="mt-6 flex justify-end gap-3">
                  <AlertDialog.Cancel asChild>
                    <button className="btn-secondary">
                      Cancel
                    </button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <button
                      className="btn-primary bg-error-600 hover:bg-error-700"
                      onClick={handleLeave}
                    >
                      Leave Game
                    </button>
                  </AlertDialog.Action>
                </div>
              </motion.div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        )}
      </AnimatePresence>
    </AlertDialog.Root>
  );
};

export default LeaveGame;
