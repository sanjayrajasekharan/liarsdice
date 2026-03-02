import { CreateGameResponse, AddPlayerResponse, GetGameStatusResponse } from 'shared/api';
export const createApiClient = (baseUrl: string) => ({
  async createGame(hostName: string): Promise<CreateGameResponse> {
    const response = await fetch(`${baseUrl}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create game');
    }
    return response.json();
  },

  async joinGame(gameCode: string, playerName: string): Promise<AddPlayerResponse> {
    const response = await fetch(`${baseUrl}/api/games/${gameCode}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join game');
    }
    return response.json();
  },

  async getGameStatus(gameCode: string, playerId?: string): Promise<GetGameStatusResponse> {
    const url = playerId
      ? `${baseUrl}/api/games/${gameCode}?playerId=${playerId}`
      : `${baseUrl}/api/games/${gameCode}`;
    const response = await fetch(url);
    if (!response.ok) {
      return { exists: false, joinable: false };
    }
    return response.json();
  },
});
