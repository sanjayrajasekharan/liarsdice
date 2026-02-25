import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { EntryCard } from '@components/layout';
import { diceSvgs } from '../../assets/dice';

const DICE_FACES = [1, 2, 3, 4, 5, 6] as const;
const SHUFFLE_INTERVAL_MS = 1000;

const LandingPage: React.FC = () => {
  const [currentFace, setCurrentFace] = useState(1);

  // Periodic dice shuffle animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFace((prev) => {
        const otherFaces = DICE_FACES.filter((face) => face !== prev);
        const nextIndex = Math.floor(Math.random() * otherFaces.length);
        return otherFaces[nextIndex];
      });
    }, SHUFFLE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const titleContent = (
    <span className="flex font-mono items-center justify-center gap-6">
      Liar's Dice
      <img
        src={diceSvgs[currentFace]}
        alt={`Dice face ${currentFace}`}
        className="w-8 h-8 inline-block"
      />
    </span>
  );

  return (
    <EntryCard title="">
      <h1 className="text-2xl font-mono text-text-primary mb-6 p-2 text-center font-display">
        {titleContent}
      </h1>
      <div className="flex flex-col gap-3">
        <Link to="/create">
          <button className="btn-primary w-full">
            New Game
          </button>
        </Link>
        <Link to="/join">
          <button className="btn-secondary w-full">
            Join Game
          </button>
        </Link>
      </div>
    </EntryCard>
  );
};

export default LandingPage;
