import { injectable } from 'inversify';
import { GameCode, PlayerId } from 'shared/domain.js';

export const TURN_TIMEOUT_MS = 60_000;

export type TurnTimeoutCallback = (playerId: PlayerId, gameCode: GameCode) => void;

interface ActiveTimer {
  playerId: PlayerId;
  gameCode: GameCode;
  timer: ReturnType<typeof setTimeout>;
  deadline: Date;
}

@injectable()
export default class TurnTimerService {
  private activeTimers: Map<GameCode, ActiveTimer> = new Map();

  startTimer(playerId: PlayerId, gameCode: GameCode, callback: TurnTimeoutCallback): Date {
    this.cancelTimer(gameCode);

    const deadline = new Date(Date.now() + TURN_TIMEOUT_MS);

    const timer = setTimeout(() => {
      this.activeTimers.delete(gameCode);
      callback(playerId, gameCode);
    }, TURN_TIMEOUT_MS);

    this.activeTimers.set(gameCode, {
      playerId,
      gameCode,
      timer,
      deadline,
    });

    return deadline;
  }

  cancelTimer(gameCode: GameCode): boolean {
    const active = this.activeTimers.get(gameCode);
    if (active) {
      clearTimeout(active.timer);
      this.activeTimers.delete(gameCode);
      return true;
    }
    return false;
  }

  getDeadline(gameCode: GameCode): Date | null {
    const active = this.activeTimers.get(gameCode);
    return active?.deadline ?? null;
  }

  getCurrentTurnPlayer(gameCode: GameCode): PlayerId | null {
    const active = this.activeTimers.get(gameCode);
    return active?.playerId ?? null;
  }

  clearAll(): void {
    for (const active of this.activeTimers.values()) {
      clearTimeout(active.timer);
    }
    this.activeTimers.clear();
  }
}
