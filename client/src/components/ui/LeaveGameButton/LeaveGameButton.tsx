import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { GameService } from '@services/gameService';

const LeaveGameButton: React.FC = () => {
  const navigate = useNavigate();

  const handleLeave = async () => {
    const success = await GameService.leaveGame();
    if (success) {
      navigate('/');
    }
  };

  return (
    <AlertDialog.Root>
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
            {/* Door frame: 3-sided rectangle (left, bottom, top edges) with rounded corners */}
            <path d="M14 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" />
            {/* Arrow head: chevron pointing right */}
            <polyline points="18 17 23 12 18 7" />
            {/* Arrow shaft: horizontal line from tip to inside door */}
            <line x1="23" y1="12" x2="10" y2="12" />
          </svg>
        </button>
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-elevated rounded-xl p-6 shadow-xl w-[90vw] max-w-md data-[state=open]:animate-scale-in">
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
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

export default LeaveGameButton;
