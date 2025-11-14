import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { diceSvgs } from "../../assets/dice";
import * as Dialog from "@radix-ui/react-dialog";

// TODO: Add accessibility features
// TODO: Add keyboard navigation support
// TODO: IMPORTANT! swipe to close on mobile
type ClaimInputProps = {
  currentDieValue: number;
  currentCount: number;
  onClose: () => void;
  onSubmit: (diceValue: number, count: number) => void;
};

const ClaimInput: React.FC<ClaimInputProps> = ({ currentDieValue, currentCount, onClose, onSubmit }) => {
  const [dieValue, setDieValue] = useState(currentDieValue);
  const [count, setCount] = useState(currentCount + 1);
  const [isOpen, setOpen] = useState(false);
  const [otherValue, setOtherValue] = useState<number | undefined>(undefined);
  const [otherValueSelected, setOtherValueSelected] = useState(false);
  const startCount = dieValue <= currentDieValue ? currentCount + 1 : currentCount;

  return (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button onClick={() => setOpen(!isOpen)}>Open Claim Input</button>
      </Dialog.Trigger>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay className="fixed inset-0" />
            <Dialog.Content asChild>
                <motion.div className="fixed inset-x-0 bottom-0 shadow-lg rounded-xl p-4 m-4 bg-white"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className="flex flex-row items-center justify-center"> {/* diceSelector */}
                    {Object.entries(diceSvgs).map(([value, src]) => (
                      <button
                        key={value}
                        className="m-2 p-2 border-2 border-transparent relative flex justify-center items-center w-full rounded-xl
                                       hover:cursor-pointer hover:border-accent"
                        onClick={() => {
                          const newDieValue = Number(value);
                          const newStartCount = newDieValue <= currentDieValue ? currentCount + 1 : currentCount;
                          setDieValue(newDieValue);
                          setCount(newStartCount);
                        }}
                      >
                        <img src={src} alt={`Dice ${value}`} className="block h-8" />
                        {
                          value == String(dieValue) && (
                            <motion.div
                              className="absolute -inset-1 z-1 border border-accent rounded-xl"
                              layoutId="selected-die"
                              id="selected-die"
                              initial={false}
                            />
                          )
                        }
                      </button>
                    ))}
                  </div>
                  <div className="m-2 rounded-xl flex flex-row gap-2 items-stretch justify-between flex-wrap text-xl w-full"> {/* countSelector */}
                    {
                      Array.from({ length: 4 }, (_, i) => i + startCount).map((value) => (
                        <button
                          key={value}
                          className="py-2 px-2 border-2 border-transparent relative flex-1 flex justify-center items-center z-1 w-full rounded-xl
                                           hover:cursor-pointer hover:border-accent"
                          onClick={() => { setCount(value) }}
                        >
                          {value}
                          {
                            !otherValueSelected && value === count && (
                              <motion.div
                                className="absolute inset-[-1px] z-1 border border-accent rounded-xl"
                                layoutId={`selected-count-${dieValue}`}
                                key={`selected-count-${dieValue}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              />
                            )
                          }
                        </button>
                      ))
                    }
                    <div className="mx-2 py-2 px-4 relative flex-1 flex justify-center items-center z-1 w-full rounded-xl
                                             text-center text-gray-900 bg-gray-100 ">
                      <input
                        className="text-center w-full bg-transparent focus:outline-none"
                        type="number"
                        value={otherValue ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            setOtherValue(undefined);
                          } else {
                            const numValue = parseInt(value, 10);
                            if (!isNaN(numValue)) {
                              setOtherValue(numValue);
                            }
                          }
                        }}
                        onBlur ={() => {
                          if (otherValue !== undefined && otherValue >= startCount) {
                            setCount(otherValue);
                          }
                          if (otherValue === undefined || otherValue < startCount + 4) {
                            setOtherValue(undefined);
                            setOtherValueSelected(false);
                          }
                        }}
                        onFocus={() => {
                          setOtherValueSelected(true);
                        }}
                        placeholder="Other"
                      />
                          {
                            otherValueSelected && (
                              <motion.div
                                className="absolute inset-[-1px] z-1 border border-accent rounded-xl"
                                layoutId={`selected-count-${dieValue}`}
                                key={`selected-count-${dieValue}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              />
                            )
                          }
                          </div>
                    
                  </div>
                  <button className="mt-4 mx-1 py-2 px-4 border-2 border-transparent relative flex-1 flex justify-center items-center z-1 w-full rounded-xl 
                                    bg-brand hover:cursor-pointer hover:bg-brand-light text-gray-100"
                  >
                    Submit
                  </button>
                  <button 
                  onClick={()=>{setOpen(false)}}
                  className="my-2 mx-1 py-2 px-4 border-2 border-transparent relative flex-1 flex justify-center items-center z-1 w-full rounded-xl 
                                    bg-brand-dark hover:cursor-pointer hover:bg-brand text-gray-100">
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
