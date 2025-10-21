import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGameState } from "../store/gameStore";
import { GameService } from "../services/gameService";

// GameRouteGuard for /game/:gameCode
const GameRouter: React.FC = () => {
    const navigate = useNavigate();
    const { gameCode } = useParams<{ gameCode: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [spectator, setSpectator] = useState(false);
    const gameState = useGameState((state) => state.gameState);
    // You may want to get the current playerId/token from localStorage or your store
    const playerId = localStorage.getItem("playerId");
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!gameCode) return;
        setLoading(true);
        setError(null);
        // 1. Check if game exists and get status
        fetch(`/games/${gameCode}`)
            .then(async (res) => {
                if (!res.ok) throw new Error("not found");
                return res.json();
            })
            .then(async (gameInfo) => {
                // 2. Check if user is already in the game
                if (playerId) {
                    const memberRes = await fetch(`/games/${gameCode}/players/${playerId}`);
                    if (memberRes.ok) {
                        // Already in game, rejoin
                        navigate(`/game/${gameCode}`);
                        setLoading(false);
                        return;
                    }
                }
                // 3. If joinable, try to join
                if (gameInfo.joinable) {
                    GameService.joinGame(gameCode)
                        .then(() => {
                            navigate(`/game/${gameCode}`);
                        })
                        .catch((err) => {
                            setError("Could not join game: " + err.message);
                        })
                        .finally(() => setLoading(false));
                } else if (gameInfo.status === "in_progress") {
                    // 4. If game started and not in it, go to spectator
                    setSpectator(true);
                    setLoading(false);
                } else {
                    setError("Game not joinable: " + (gameInfo.reason || gameInfo.status));
                    setLoading(false);
                }
            })
            .catch(() => {
                setError("Game not found");
                setLoading(false);
            });
    }, [gameCode, playerId, navigate]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;
    if (spectator) return <div>Spectator mode coming soon.</div>;
    // If joined, GameRoomNew will render via router
    return null;
};

export default GameRouter;