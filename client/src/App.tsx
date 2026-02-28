import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastProvider } from "@components/ui/Toast";
import { SessionProvider } from "@components/SessionProvider";
import LandingPage from "./pages/Landing/Landing";
import CreateGame from "./pages/CreateGame";
import JoinGame from "./pages/JoinGame";
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
                <Route path="/game/:gameCode" element={<Game />} />
              </Routes>
            </div>
          </div>
        </SessionProvider>
      </ToastProvider>
    </Router>
  );
};

export default App;
