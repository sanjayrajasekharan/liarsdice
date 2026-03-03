import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GameService } from '@services/gameService';
import { toast } from '@store/toastStore';

interface SessionProviderProps {
  children: React.ReactNode;
}

const ENTRY_ROUTES = ['/', '/create'];

function isEntryRoute(pathname: string): boolean {
  return ENTRY_ROUTES.includes(pathname) || pathname.startsWith('/join');
}

function extractGameCodeFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/game\/([^/]+)/);
  return match ? match[1] : null;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const lastProcessedPath = useRef<string | null>(null);

  useEffect(() => {
    const processRoute = async () => {
      if (isProcessing) return;
      if (lastProcessedPath.current === location.pathname) return;

      setIsProcessing(true);
      lastProcessedPath.current = location.pathname;

      try {
        const session = await GameService.initializeSession();
        const urlGameCode = extractGameCodeFromPath(location.pathname);
        const isOnGameRoute = urlGameCode !== null;
        const onEntryRoute = isEntryRoute(location.pathname);

        if (session) {
          if (onEntryRoute) {
            navigate(`/game/${session.gameCode}`, { replace: true });
            lastProcessedPath.current = `/game/${session.gameCode}`;
          } else if (isOnGameRoute && urlGameCode !== session.gameCode) {
            toast.error('You cannot join two games at once. Leave your current game first.');
            navigate(`/game/${session.gameCode}`, { replace: true });
            lastProcessedPath.current = `/game/${session.gameCode}`;
          }
        } else {
          if (isOnGameRoute && urlGameCode) {
            const status = await GameService.getGameStatus(urlGameCode);
            if (status.joinable) {
              navigate('/join', { state: { gameCode: urlGameCode }, replace: true });
              lastProcessedPath.current = '/join';
            } else {
              toast.error(status.reason || 'Unable to join game');
              navigate('/', { replace: true });
              lastProcessedPath.current = '/';
            }
          }
        }
      } finally {
        setIsProcessing(false);
        setIsInitialized(true);
      }
    };

    processRoute();
  }, [location.pathname, navigate, isProcessing]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-border-light border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};
