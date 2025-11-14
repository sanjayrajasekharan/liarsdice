// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landing/Landing";
import CreateGame from "./pages/CreateGame";
import JoinGame from "./pages/JoinGame";
import ClaimBanner from "./components/ClaimBanner/ClaimBanner";
import PlayersDisplayMock from "./components/PlayersDisplay/PlayerDisplayMock";
import DiceRollMock from "./components/DiceRoll/DiceRollMock";
import RevealMock from "./components/Reveal/RevealMock";
import ClaimInput from "./components/ClaimInput/ClaimInput";
import LobbyMock from "./components/Lobby/LobbyMock";

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/create" element={<CreateGame />} />
                <Route path="/join" element={<JoinGame />} />
                <Route path="/banner" element={<ClaimBanner currentClaim={{ value: 4, quantity: 2 }} userName="April" />}/>
                <Route path="/players" element={<PlayersDisplayMock />} />
                <Route path="/dice" element={<DiceRollMock />} />
                <Route path="/reveal" element={<RevealMock />} />
                <Route path="/claim" element={<ClaimInput currentDieValue={1} currentCount={1} onClose={() => {}} onSubmit={() => {}} />} />
                <Route path="/lobby" element={<LobbyMock />} />
            </Routes>
        </Router>
    );
};

export default App;
