import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { GameSettings } from "shared/domain";

type SettingsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: GameSettings;
  onSave: (settings: Partial<GameSettings>) => void;
};

const MIN_DICE = 1;
const MAX_DICE = 6;

const TIMEOUT_OPTIONS = [
  { value: 15, label: "15s" },
  { value: 30, label: "30s" },
  { value: 60, label: "1m" },
  { value: 90, label: "1.5m" },
  { value: 120, label: "2m" },
];

const POST_ROUND_DELAY_OPTIONS = [
  { value: 10, label: "10s" },
  { value: 20, label: "20s" },
  { value: 30, label: "30s" },
  { value: 60, label: "1m" },
];

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSave,
}) => {
  const [startingDice, setStartingDice] = useState(currentSettings.startingDice);
  const [turnTimeoutSeconds, setTurnTimeoutSeconds] = useState(currentSettings.turnTimeoutSeconds);
  const [postRoundDelaySeconds, setPostRoundDelaySeconds] = useState(currentSettings.postRoundDelaySeconds);

  useEffect(() => {
    if (isOpen) {
      setStartingDice(currentSettings.startingDice);
      setTurnTimeoutSeconds(currentSettings.turnTimeoutSeconds);
      setPostRoundDelaySeconds(currentSettings.postRoundDelaySeconds);
    }
  }, [isOpen, currentSettings]);

  const handleSave = () => {
    const changes: Partial<GameSettings> = {};
    if (startingDice !== currentSettings.startingDice) {
      changes.startingDice = startingDice;
    }
    if (turnTimeoutSeconds !== currentSettings.turnTimeoutSeconds) {
      changes.turnTimeoutSeconds = turnTimeoutSeconds;
    }
    if (postRoundDelaySeconds !== currentSettings.postRoundDelaySeconds) {
      changes.postRoundDelaySeconds = postRoundDelaySeconds;
    }
    if (Object.keys(changes).length > 0) {
      onSave(changes);
    }
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-surface-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className="fixed inset-x-4 top-1/2 -translate-y-1/2 mx-auto max-w-md shadow-xl rounded-2xl p-6 bg-surface-elevated"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Dialog.Description className="sr-only">
                  Configure game settings like starting dice and turn timeout
                </Dialog.Description>

                <div className="space-y-6">
                  {/* Starting Dice */}
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium text-text-secondary">
                      Starting Dice
                    </legend>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: MAX_DICE - MIN_DICE + 1 }, (_, index) => MIN_DICE + index).map((value) => (
                        <button
                          key={value}
                          onClick={() => setStartingDice(value)}
                          className="relative px-4 py-3 border-2 border-transparent rounded-xl font-medium text-text-primary
                                     hover:cursor-pointer hover:border-primary-300 transition-colors"
                        >
                          {value}
                          {startingDice === value && (
                            <motion.div
                              className="absolute inset-0 border-2 border-primary-500 rounded-xl"
                              layoutId="selected-dice"
                              initial={false}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {/* Turn Timeout */}
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium text-text-secondary">
                      Turn Timeout
                    </legend>
                    <div className="flex flex-wrap gap-1">
                      {TIMEOUT_OPTIONS.map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setTurnTimeoutSeconds(value)}
                          className="relative px-4 py-3 border-2 border-transparent rounded-xl font-medium text-text-primary
                                     hover:cursor-pointer hover:border-primary-300 transition-colors"
                        >
                          {label}
                          {turnTimeoutSeconds === value && (
                            <motion.div
                              className="absolute inset-0 border-2 border-primary-500 rounded-xl"
                              layoutId="selected-timeout"
                              initial={false}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {/* Post-Round Delay */}
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium text-text-secondary">
                      Post-Round Delay
                    </legend>
                    <div className="flex flex-wrap gap-1">
                      {POST_ROUND_DELAY_OPTIONS.map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setPostRoundDelaySeconds(value)}
                          className="relative px-4 py-3 border-2 border-transparent rounded-xl font-medium text-text-primary
                                     hover:cursor-pointer hover:border-primary-300 transition-colors"
                        >
                          {label}
                          {postRoundDelaySeconds === value && (
                            <motion.div
                              className="absolute inset-0 border-2 border-primary-500 rounded-xl"
                              layoutId="selected-post-round-delay"
                              initial={false}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>

                {/* Action buttons */}
                <div className="mt-8 space-y-2">
                  <button onClick={handleSave} className="btn-primary w-full">
                    Save Settings
                  </button>
                  <div className="flex gap-2">
                    <button onClick={onClose} className="btn-ghost flex-1">
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};

export default SettingsDialog;
