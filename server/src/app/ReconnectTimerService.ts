import { injectable } from 'inversify';
import { GameCode, PlayerId } from 'shared/domain.js';

export const DEFAULT_RECONNECT_GRACE_MS = 30_000;

type ReconnectKey = `${GameCode}:${PlayerId}`;

export type ReconnectExpiredCallback = (playerId: PlayerId, gameCode: GameCode) => void;

interface PendingDisconnect {
  playerId: PlayerId;
  gameCode: GameCode;
  timer: ReturnType<typeof setTimeout>;
  disconnectedAt: Date;
}

@injectable()
export default class ReconnectTimerService {
  private pending: Map<ReconnectKey, PendingDisconnect> = new Map();

  private makeKey(gameCode: GameCode, playerId: PlayerId): ReconnectKey {
    return `${gameCode}:${playerId}`;
  }

  startGracePeriod(
    playerId: PlayerId,
    gameCode: GameCode,
    onExpire: ReconnectExpiredCallback,
    timeoutMs: number = DEFAULT_RECONNECT_GRACE_MS
  ): Date {
    const key = this.makeKey(gameCode, playerId);
    this.cancelGracePeriod(playerId, gameCode);

    const disconnectedAt = new Date();

    const timer = setTimeout(() => {
      this.pending.delete(key);
      onExpire(playerId, gameCode);
    }, timeoutMs);

    this.pending.set(key, {
      playerId,
      gameCode,
      timer,
      disconnectedAt,
    });

    return new Date(Date.now() + timeoutMs);
  }

  cancelGracePeriod(playerId: PlayerId, gameCode: GameCode): boolean {
    const key = this.makeKey(gameCode, playerId);
    const pending = this.pending.get(key);

    if (pending) {
      clearTimeout(pending.timer);
      this.pending.delete(key);
      return true;
    }

    return false;
  }

  isDisconnected(playerId: PlayerId, gameCode: GameCode): boolean {
    const key = this.makeKey(gameCode, playerId);
    return this.pending.has(key);
  }

  getDisconnectedPlayers(gameCode: GameCode): PlayerId[] {
    const disconnected: PlayerId[] = [];

    for (const [key, pending] of this.pending) {
      if (pending.gameCode === gameCode) {
        disconnected.push(pending.playerId);
      }
    }

    return disconnected;
  }

  cancelAllForGame(gameCode: GameCode): void {
    for (const [key, pending] of this.pending) {
      if (pending.gameCode === gameCode) {
        clearTimeout(pending.timer);
        this.pending.delete(key);
      }
    }
  }

  clearAll(): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
    }
    this.pending.clear();
  }
}
