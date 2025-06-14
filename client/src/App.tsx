// src/App.tsx
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landing/Landing";
import CreateGame from "./pages/CreateGame";
import JoinGame from "./pages/JoinGame";
import GameRoom from "./components/GameRoom";
// import DiceRoll from "./components/Game/DiceRoll/DiceRoll";
import UserController from "./components/UserController/UserController";
import UserDisplay from "./components/UserDisplay";
import DiceRoller from "./components/DiceRoll/DiceRoll";
import Table from "./pages/Table/Table";
import PlayerLobby from "./components/PlayerLobby/PlayerLobby";
import ClaimInput from "./components/ClaimInput/ClaimInput";
import { GameService } from "./services/gameService";
import RollModal from "./components/RollModal/RollModal";
// Import other components (e.g., CreateGame, JoinGame) when they are ready

const App: React.FC = () => {
    const [gameCode, setGameCode] = useState("");
    const [playerName, setPlayerName] = useState("");
    const [playerId, setPlayerId] = useState("");
    const [isHost, setIsHost] = useState(false);
    
    // update to zustand store


    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route
                    path="/create"
                    element={
                        <CreateGame
                            gameCode={gameCode}
                            setGameCode={setGameCode}
                            playerName={playerName}
                            setPlayerName={setPlayerName}
                            playerId={playerId}
                            setPlayerId={setPlayerId}
                            isHost={isHost}
                            setIsHost={setIsHost}
                        />
                    }
                />
                <Route
                    path="/join"
                    element={
                        <JoinGame
                            gameCode={gameCode}
                            setGameCode={setGameCode}
                            playerName={playerName}
                            setPlayerName={setPlayerName}
                            playerId={playerId}
                            setPlayerId={setPlayerId}
                        />
                    }
                />
                <Route
                    path="/game/:gameCode"
                    element={
                        <GameRoom
                            playerName={playerName}
                            playerId={playerId}
                            isHost={isHost}
                        />
                    }
                />
                <Route
                    path="/dice"
                    element={
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                marginTop: "50px",
                            }}
                        >
                            <DiceRoller numDice = {4} diceValues={[1,3,5,2]} rolling = {false}/>
                        </div>
                    }
                />
                <Route
                    path="/user"
                    element={
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                marginTop: "50px",
                            }}
                        >
                            <UserController
                                userName="Sanjay"
                                userIcon="🙉"
                                numDice={6}
                                isUser={true}
                                isTurn={true}
                            />
                        </div>
                    }
                />
                <Route path="/table" element={
                <div style={{ textAlign: "center", padding: "20px" }}>
                    {/* {name: "Abdullah", icon: "🦍", numDice: 4}, {name: "Ben", icon: "🦁", numDice: 3}, {name: "Colin", icon: "🐭", numDice: 2} */}
                <Table user={{name: "Sanjay", icon: "🙉", numDice:6}} opponents={[{name: "April", icon: "🦧", numDice: 1}, {name: "Abdullah", icon: "🦍", numDice: 4}, {name: "Ben", icon: "🦁", numDice: 3}, {name: "Colin", icon: "🐭", numDice: 2} ]} />
            </div>
                
                }/>
                <Route path="/playerLobby" element={<PlayerLobby />} />

                <Route path="/claimInput" element={<ClaimInput open={true} onClose={() => {}} onSubmit={(diceValue, count) => GameService.makeClaim(diceValue, count)} />} />
                // RollModal
                <Route path="/rollModal" element={<RollModal />} />
            </Routes>
        </Router>
    );
};

export default App;
