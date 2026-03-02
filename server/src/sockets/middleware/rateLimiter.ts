import { Socket } from 'socket.io';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const eventLimiter = new RateLimiterMemory({
    points: 30,
    duration: 10,
});

const connectionLimiter = new RateLimiterMemory({
    points: 5,
    duration: 60,
});

export function rateLimiterMiddleware(socket: Socket, next: (err?: any) => void) {
    eventLimiter.consume(socket.id)
        .then(() => next())
        .catch(() => next(new Error('Rate limit exceeded')));
}

export function connectionRateLimiterMiddleware(socket: Socket, next: (err?: any) => void) {
    const ip = socket.handshake.address;
    connectionLimiter.consume(ip)
        .then(() => next())
        .catch(() => next(new Error('Too many connections')));
}
