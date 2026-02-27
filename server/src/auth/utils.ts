import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-duper-secret-key';
const TOKEN_EXPIRY = '24h';

export interface TokenPayload {
  playerId: string;
  gameCode: string;
  playerName: string;
}

export function generatePlayerToken(playerId: string, playerName: string, gameCode: string): string {
  const payload: TokenPayload = {
    playerId,
    playerName,
    gameCode,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyPlayerToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}
