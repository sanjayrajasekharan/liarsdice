import { injectable } from 'inversify';
import { GameCode } from 'shared/domain.js';

export type RoundStartCallback = (gameCode: GameCode) => void;

interface ActiveRoundTimer {
  gameCode: GameCode;
  timer: ReturnType<typeof setTimeout>;
  deadline: Date;
}

@injectable()
export default class RoundTimerService {
  private activeTimers: Map<GameCode, ActiveRoundTimer> = new Map();

  startTimer(gameCode: GameCode, callback: RoundStartCallback, delayMs: number): Date {
    this.cancelTimer(gameCode);

    const deadline = new Date(Date.now() + delayMs);

    const timer = setTimeout(() => {
      this.activeTimers.delete(gameCode);
      callback(gameCode);
    }, delayMs);

    this.activeTimers.set(gameCode, {
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

  clearAll(): void {
    for (const active of this.activeTimers.values()) {
      clearTimeout(active.timer);
    }
    this.activeTimers.clear();
  }
}
