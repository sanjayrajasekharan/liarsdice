import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "@components/common/Toast";
import { SessionProvider } from "@components/providers/SessionProvider";
import LandingPage from "./pages/Landing/Landing";
import CreateGame from "./pages/CreateGame/CreateGame";
import JoinGame from "./pages/JoinGame/JoinGame";
import Game from "./pages/Game/Game";

const App: React.FC = () => {
  return (
    <Router>
      <ToastProvider>
        <SessionProvider>
          <div className="h-dvh flex justify-center bg-surface-secondary">
            <div className="w-full max-w-[430px] h-dvh bg-surface-secondary">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/create" element={<CreateGame />} />
                <Route path="/join" element={<JoinGame />} />
                <Route path="/join/:gameCode" element={<JoinGame />} />
                <Route path="/game/:gameCode" element={<Game />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </SessionProvider>
      </ToastProvider>
    </Router>
  );
};

export default App;
