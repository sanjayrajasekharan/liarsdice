// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landing/Landing";
import CreateGame from "./pages/CreateGame";
import JoinGame from "./pages/JoinGame";
import GameRoom from "./components/GameRoom/GameRoom";
import GameRoomMock from "./components/GameRoom/GameRoomMock";
import GameRoomNew from "./components/GameRoomNew";

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/create" element={<CreateGame />} />
                <Route path="/join" element={<JoinGame />} />
                <Route path="/game/:gameCode" element={<GameRoom />} />
                <Route path="/game-new/:gameCode" element={<GameRoomNew />} />
                <Route path="/mock" element={<GameRoomMock />} />
            </Routes>
        </Router>
    );
};

export default App;
