import React from 'react';

interface EntryCardProps {
  children: React.ReactNode;
  title: string;
}

/**
 * Shared card component for entry pages (Landing, CreateGame, JoinGame).
 * Uses a fixed min-height to prevent layout jumps when navigating between pages.
 * The min-height accommodates the tallest form (JoinGame with 2 inputs).
 */
const EntryCard: React.FC<EntryCardProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full min-h-[340px] flex flex-col justify-center">
        {title && (
          <h1 className="text-2xl font-mono text-text-primary mb-6 p-2 text-center font-display">
            {title}
          </h1>
        )}
        {children}
      </div>
    </div>
  );
};

export default EntryCard;
