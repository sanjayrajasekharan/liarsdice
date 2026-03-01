import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DEFAULT_GAME_SETTINGS } from 'shared/domain';
import { useGameState } from '../../../services/gameService';
import { GameService } from '../../../services/gameService';
import { getDialogContainer } from '../Dialog/dialogUtils';

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

const Settings: React.FC<{}> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(useGameState.getState().gameState?.settings ?? DEFAULT_GAME_SETTINGS);

  const onSave = () => {
    GameService.updateSettings(settings);
  }

  return (
    <Dialog.Root onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Game settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>

          Settings
        </button>
      </Dialog.Trigger>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount container={getDialogContainer()}>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-surface-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
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
                          onClick={() => setSettings({ ...settings, startingDice: value })}
                          className="relative px-4 py-3 border-2 border-transparent rounded-xl font-medium text-text-primary
                                 hover:cursor-pointer hover:border-primary-300 transition-colors"
                        >
                          {value}
                          {settings.startingDice === value && (
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
                          onClick={() => setSettings({ ...settings, turnTimeoutSeconds: value })}
                          className="relative px-4 py-3 border-2 border-transparent rounded-xl font-medium text-text-primary
                                 hover:cursor-pointer hover:border-primary-300 transition-colors"
                        >
                          {label}
                          {settings.turnTimeoutSeconds === value && (
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
                          onClick={() => setSettings({ ...settings, postRoundDelaySeconds: value })}
                          className="relative px-4 py-3 border-2 border-transparent rounded-xl font-medium text-text-primary
                                 hover:cursor-pointer hover:border-primary-300 transition-colors"
                        >
                          {label}
                          {settings.postRoundDelaySeconds === value && (
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
                  <Dialog.Close asChild>
                    <button onClick={onSave} className="btn-primary w-full">
                      Save Settings
                    </button>
                  </Dialog.Close>
                  <Dialog.Close asChild>
                    <button className="btn-ghost w-full">Cancel</button>
                  </Dialog.Close>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )
        }
      </AnimatePresence>
    </Dialog.Root>



  )
}

export default Settings;
