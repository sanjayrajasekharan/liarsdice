import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { diceSvgs } from "../../../assets/dice";
import SlidingSelector from "../SlidingSelector/SlidingSelector";

type ClaimInputProps = {
  currentDieValue: number;
  currentCount: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (diceValue: number, count: number) => void;
};

const DIE_OPTIONS = Object.entries(diceSvgs).map(([value, src]) => ({
  value: Number(value),
  label: <img src={src} alt={`Dice ${value}`} className="block h-10 w-10" />,
}));

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

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<number | 'other', HTMLElement>>(new Map());
  const [countIndicatorStyle, setCountIndicatorStyle] = useState({ left: 0, width: 0 });
  const [shouldAnimateCount, setShouldAnimateCount] = useState(false);

  const updateCountIndicator = useCallback(() => {
    const selectedKey = otherValueSelected ? 'other' : count;
    const button = buttonRefs.current.get(selectedKey);
    const container = containerRef.current;
    if (button && container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      setCountIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      });
    }
  }, [count, otherValueSelected]);

  useEffect(() => {
    updateCountIndicator();
  }, [updateCountIndicator]);

  useLayoutEffect(() => {
    if (isOpen) {
      updateCountIndicator();
    }
  }, [isOpen, updateCountIndicator]);

  useEffect(() => {
    if (isOpen) {
      setDieValue(currentDieValue);
      setCount(currentCount + 1);
      setOtherValue(undefined);
      setOtherValueSelected(false);
      setCountIndicatorStyle({ left: 0, width: 0 });
      setShouldAnimateCount(false);
      const timer = setTimeout(() => setShouldAnimateCount(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentDieValue, currentCount]);

  const handleDieValueChange = (newDieValue: number) => {
    const newStartCount = newDieValue <= currentDieValue ? currentCount + 1 : currentCount;
    setDieValue(newDieValue);
    setCount(newStartCount);
    setOtherValueSelected(false);
  };

  const handleSubmit = () => {
    onSubmit(dieValue, count);
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
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                className="fixed inset-x-0 bottom-0 shadow-xl rounded-t-2xl p-4 bg-surface-elevated"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <Dialog.Description className="sr-only">
                  Select a die face and count to make your claim
                </Dialog.Description>

                {/* Die value selector */}
                <div className="flex justify-center">
                  <SlidingSelector
                    options={DIE_OPTIONS}
                    value={dieValue}
                    onChange={handleDieValueChange}
                    buttonClassName="p-2 hover:cursor-pointer"
                  />
                </div>

                {/* Count selector */}
                <div ref={containerRef} className="relative flex flex-row gap-2 items-stretch justify-between mt-4 text-xl w-full">
                  {Array.from({ length: 4 }, (_, i) => i + startCount).map((value) => (
                    <button
                      key={value}
                      ref={(el) => {
                        if (el) buttonRefs.current.set(value, el);
                      }}
                      className="relative z-10 py-3 px-2 flex-1 flex justify-center items-center rounded-xl
                                 border-2 border-transparent hover:border-primary-300 hover:cursor-pointer transition-colors text-text-primary font-medium"
                      onClick={() => {
                        setCount(value);
                        setOtherValueSelected(false);
                      }}
                      type="button"
                    >
                      {value}
                    </button>
                  ))}

                  {/* Custom count input */}
                  <div
                    ref={(el) => {
                      if (el) buttonRefs.current.set('other', el);
                    }}
                    className="relative z-10 py-3 px-4 flex-1 flex justify-center items-center rounded-xl
                               text-center text-text-primary bg-surface-secondary"
                  >
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
                  </div>

                  {/* Sliding indicator for count */}
                  {countIndicatorStyle.width > 0 && (
                    <div
                      className={`absolute top-0 h-full border-2 border-primary-500 rounded-xl pointer-events-none ${shouldAnimateCount ? 'transition-all duration-200 ease-out' : ''}`}
                      style={{
                        left: countIndicatorStyle.left,
                        width: countIndicatorStyle.width,
                      }}
                    />
                  )}
                </div>

                {/* Action buttons */}
                <button
                  onClick={handleSubmit}
                  className="btn-primary w-full mt-4"
                >
                  Claim
                </button>
                <button
                  onClick={onClose}
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
