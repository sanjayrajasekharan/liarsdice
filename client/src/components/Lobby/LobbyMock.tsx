import React, { useState, useEffect } from 'react';
import Lobby from './Lobby';

const LobbyMock: React.FC = () => {
    const initialPlayers = [
        { name: "Alice", isHost: true, isPlayer: true },
    ];

    const availablePlayers = [
        { name: "Bob", isHost: false, isPlayer: true },
        { name: "Charlie", isHost: false, isPlayer: true },
        { name: "Diana", isHost: false, isPlayer: true },
        { name: "Eve", isHost: false, isPlayer: true },
        { name: "Frank", isHost: false, isPlayer: true },
        { name: "Grace", isHost: false, isPlayer: true },
    ];

    const [players, setPlayers] = useState(initialPlayers);
    const [availablePool, setAvailablePool] = useState(availablePlayers);
    const [isAutoMode, setIsAutoMode] = useState(false);

    // Auto join/leave simulation
    useEffect(() => {
        if (!isAutoMode) return;

        const interval = setInterval(() => {
            const shouldJoin = Math.random() > 0.5;
            
            if (shouldJoin && availablePool.length > 0 && players.length < 6) {
                // Add a random player from available pool
                const randomIndex = Math.floor(Math.random() * availablePool.length);
                const newPlayer = availablePool[randomIndex];
                
                setPlayers(prev => [...prev, newPlayer]);
                setAvailablePool(prev => prev.filter((_, index) => index !== randomIndex));
            } else if (!shouldJoin && players.length > 1) {
                // Remove a random non-host player
                const nonHostPlayers = players.filter(p => !p.isHost);
                if (nonHostPlayers.length > 0) {
                    const randomPlayer = nonHostPlayers[Math.floor(Math.random() * nonHostPlayers.length)];
                    
                    setPlayers(prev => prev.filter(p => p.name !== randomPlayer.name));
                    setAvailablePool(prev => [...prev, randomPlayer]);
                }
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [isAutoMode, players, availablePool]);

    const handleStartGame = () => {
        console.log("Starting game...");
        alert("Game starting!");
    };

    const handleJoinPlayer = () => {
        if (availablePool.length > 0 && players.length < 6) {
            const randomIndex = Math.floor(Math.random() * availablePool.length);
            const newPlayer = availablePool[randomIndex];
            
            setPlayers(prev => [...prev, newPlayer]);
            setAvailablePool(prev => prev.filter((_, index) => index !== randomIndex));
        }
    };

    const handleLeavePlayer = () => {
        const nonHostPlayers = players.filter(p => !p.isHost);
        if (nonHostPlayers.length > 0) {
            const randomPlayer = nonHostPlayers[Math.floor(Math.random() * nonHostPlayers.length)];
            
            setPlayers(prev => prev.filter(p => p.name !== randomPlayer.name));
            setAvailablePool(prev => [...prev, randomPlayer]);
        }
    };

    const handleReset = () => {
        setPlayers(initialPlayers);
        setAvailablePool(availablePlayers);
        setIsAutoMode(false);
    };

    return (
        <div style={{ 
            padding: '20px', 
            backgroundColor: '#f0f0f0', 
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div style={{ textAlign: 'center', maxWidth: '800px', width: '100%' }}>
                <h1 style={{ marginBottom: '20px', color: '#333' }}>Lobby Mock</h1>
                
                {/* Control Panel */}
                <div style={{
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                }}>
                    <button 
                        onClick={handleJoinPlayer}
                        disabled={availablePool.length === 0 || players.length >= 6}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            opacity: availablePool.length === 0 || players.length >= 6 ? 0.5 : 1
                        }}
                    >
                        Add Random Player ({availablePool.length} available)
                    </button>
                    
                    <button 
                        onClick={handleLeavePlayer}
                        disabled={players.filter(p => !p.isHost).length === 0}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            opacity: players.filter(p => !p.isHost).length === 0 ? 0.5 : 1
                        }}
                    >
                        Remove Random Player
                    </button>
                    
                    <button 
                        onClick={() => setIsAutoMode(!isAutoMode)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: isAutoMode ? '#ffc107' : '#007bff',
                            color: isAutoMode ? '#000' : 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        {isAutoMode ? 'Stop Auto Mode' : 'Start Auto Mode'}
                    </button>
                    
                    <button 
                        onClick={handleReset}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Reset
                    </button>
                </div>

                <div style={{ marginBottom: '10px', color: '#666', fontSize: '14px' }}>
                    Players in lobby: {players.length} | Auto mode: {isAutoMode ? 'ON' : 'OFF'}
                </div>

                <Lobby 
                    players={players} 
                    onStartGame={handleStartGame}
                />
                
                <button 
                    onClick={handleStartGame}
                    disabled={players.length < 2}
                    style={{
                        marginTop: '20px',
                        padding: '12px 24px',
                        backgroundColor: players.length < 2 ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: players.length < 2 ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}
                >
                    Start Game {players.length < 2 ? '(Need 2+ players)' : ''}
                </button>
            </div>
        </div>
    );
};

export default LobbyMock;
