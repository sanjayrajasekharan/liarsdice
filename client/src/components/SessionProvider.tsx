import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GameService } from '@services/gameService';

interface SessionProviderProps {
  children: React.ReactNode;
}

const ENTRY_ROUTES = ['/', '/create', '/join'];

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingTxt, setLoadingTxt] = useState('Loading');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initSession = async () => {
      const session = await GameService.initializeSession();

      if (session && ENTRY_ROUTES.includes(location.pathname)) {
        navigate(`/game/${session.gameCode}`, { replace: true });
      }

      setIsInitialized(true);
    };

    initSession();
  }, [location.pathname, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingTxt(prev => prev.length >= 10 ? 'Loading' : prev + '.');
    }, 500);
    return () => clearInterval(timer);
  }, [loadingTxt, setLoadingTxt]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">{loadingTxt}</div>
      </div>
    );
  }

  return <>{children}</>;
};
