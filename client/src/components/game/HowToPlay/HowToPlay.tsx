import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import Markdown from 'react-markdown';
import content from '@content/how-to-play.md?raw';

const HowToPlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          className="cursor-pointer flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="How to play"
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
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
          How to Play
        </button>
      </Dialog.Trigger>

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
                className="fixed inset-x-4 top-1/2 -translate-y-1/2 mx-auto max-w-lg max-h-[80vh] flex flex-col shadow-xl rounded-2xl bg-surface-elevated p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Dialog.Title className="sr-only">How to Play</Dialog.Title>
                <Dialog.Description className="sr-only">
                  Learn the rules of Liar's Dice
                </Dialog.Description>

                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin pl-1 pr-2">
                  <div className="prose prose-invert prose-sm max-w-none">
                    <Markdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-xl font-bold text-text-primary mb-4">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-semibold text-text-primary mt-6 mb-3">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-base font-medium text-text-primary mt-4 mb-2">{children}</h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-text-secondary mb-3 leading-relaxed">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="text-text-secondary mb-3 ml-4 list-disc space-y-1">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="text-text-secondary mb-3 ml-4 list-decimal space-y-1">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="leading-relaxed">{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong className="text-text-primary font-semibold">{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em className="text-accent-primary">{children}</em>
                        ),
                        img: ({ src, alt }) => {
                          const isDice = src?.includes('/images/dice/');
                          return (
                            <img
                              src={src}
                              alt={alt}
                              className={isDice
                                ? "inline-block h-6 w-6 align-text-bottom mx-0.5"
                                : "rounded-lg my-4 w-full"
                              }
                            />
                          );
                        },
                      }}
                    >
                      {content}
                    </Markdown>
                  </div>
                </div>

                <div className="shrink-0 pt-6">
                  <Dialog.Close asChild>
                    <button className="btn-primary w-full">Got it!</button>
                  </Dialog.Close>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};

export default HowToPlay;
