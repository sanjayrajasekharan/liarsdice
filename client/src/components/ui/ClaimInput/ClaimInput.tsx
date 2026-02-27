import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { diceSvgs } from "../../../assets/dice";
import * as Dialog from "@radix-ui/react-dialog";

type ClaimInputProps = {
  currentDieValue: number;
  currentCount: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (diceValue: number, count: number) => void;
};

const ClaimInput: React.FC<ClaimInputProps> = ({
  currentDieValue,
  currentCount,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [dieValue, setDieValue] = useState(currentDieValue);
  const [count, setCount] = useState(currentCount + 1);
  const [otherValue, setOtherValue] = useState<number | undefined>(undefined);
  const [otherValueSelected, setOtherValueSelected] = useState(false);

  const startCount = dieValue <= currentDieValue ? currentCount + 1 : currentCount;

  // Reset state when opened with new values
  useEffect(() => {
    if (isOpen) {
      setDieValue(currentDieValue);
      setCount(currentCount + 1);
      setOtherValue(undefined);
      setOtherValueSelected(false);
    }
  }, [isOpen, currentDieValue, currentCount]);

  const handleSubmit = () => {
    onSubmit(dieValue, count);
    onClose();
  };

  const handleClose = () => {
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
                className="fixed inset-x-0 bottom-0 shadow-xl rounded-t-2xl p-4 bg-surface-elevated"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <Dialog.Title className="sr-only">Make a claim</Dialog.Title>
                <Dialog.Description className="sr-only">
                  Select a die face and count to make your claim
                </Dialog.Description>

                {/* Die value selector */}
                <div className="flex flex-row items-center justify-center gap-1">
                  {Object.entries(diceSvgs).map(([value, src]) => (
                    <button
                      key={value}
                      className="p-2 border-2 border-transparent relative flex justify-center items-center rounded-xl
                                 hover:cursor-pointer hover:border-primary-300 transition-colors"
                      onClick={() => {
                        const newDieValue = Number(value);
                        const newStartCount = newDieValue <= currentDieValue ? currentCount + 1 : currentCount;
                        setDieValue(newDieValue);
                        setCount(newStartCount);
                        setOtherValueSelected(false);
                      }}
                    >
                      <img src={src} alt={`Dice ${value}`} className="block h-10 w-10" />
                      {value === String(dieValue) && (
                        <motion.div
                          className="absolute inset-0 border-2 border-primary-500 rounded-xl"
                          layoutId="selected-die"
                          initial={false}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Count selector */}
                <div className="flex flex-row gap-2 items-stretch justify-between mt-4 text-xl w-full">
                  {Array.from({ length: 4 }, (_, i) => i + startCount).map((value) => (
                    <button
                      key={value}
                      className="py-3 px-2 border-2 border-transparent relative flex-1 flex justify-center items-center rounded-xl
                                 hover:cursor-pointer hover:border-primary-300 transition-colors text-text-primary font-medium"
                      onClick={() => {
                        setCount(value);
                        setOtherValueSelected(false);
                      }}
                    >
                      {value}
                      {!otherValueSelected && value === count && (
                        <motion.div
                          className="absolute inset-0 border-2 border-primary-500 rounded-xl"
                          layoutId={`selected-count-${dieValue}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        />
                      )}
                    </button>
                  ))}

                  {/* Custom count input */}
                  <div className="py-3 px-4 relative flex-1 flex justify-center items-center rounded-xl
                                 text-center text-text-primary bg-surface-secondary">
                    <input
                      className="text-center w-full bg-transparent focus:outline-none font-medium"
                      type="number"
                      value={otherValue ?? ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        if (!isNaN(value)) {
                          setOtherValue(value);
                        } else {
                          setOtherValue(undefined);
                        }
                      }}
                      onBlur={() => {
                        if (otherValue && otherValue >= startCount) {
                          setCount(otherValue);
                        }
                        if (otherValue && otherValue > startCount + 3) {
                          setOtherValueSelected(true);
                        } else {
                          setOtherValueSelected(false);
                        }
                      }}
                      onFocus={() => setOtherValueSelected(true)}
                      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                      placeholder="Other"
                    />
                    {otherValueSelected && (
                      <motion.div
                        className="absolute inset-0 border-2 border-primary-500 rounded-xl pointer-events-none"
                        layoutId={`selected-count-${dieValue}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      />
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <button
                  onClick={handleSubmit}
                  className="btn-primary w-full mt-4"
                >
                  Claim
                </button>
                <button
                  onClick={handleClose}
                  className="btn-ghost w-full mt-2"
                >
                  Cancel
                </button>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};

export default ClaimInput;
