import { Socket } from 'socket.io';
import { verifyPlayerToken, TokenPayload } from '../../auth/utils';

/**
 * Middleware to verify the player token from socket handshake
 * Extracts token from query parameters, verifies it, and attaches payload to socket.data
 */
export function authMiddleware(socket: Socket, next: (err?: any) => void) {
    const token = socket.handshake.query.token;
    
    if (!token) {
        return next(new Error('Authentication token is required'));
    }

    const payload = verifyPlayerToken(String(token));
    
    if (!payload) {
        return next(new Error('Invalid or expired authentication token'));
    }

    socket.data.playerId = payload.playerId;
    socket.data.gameCode = payload.gameCode;
    next();
}
