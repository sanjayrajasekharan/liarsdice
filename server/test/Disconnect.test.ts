import { expect } from 'chai';
import * as Game from '@app/GameService.js';
import { generateGameCode } from '@app/GameService.js';
import TurnTimerService, { TURN_TIMEOUT_MS } from '@app/TurnTimerService.js';
import { ErrorCode } from 'shared/errors.js';
import { GameStage, GameCode, PlayerId, GameState, Claim, DieFace } from 'shared/domain.js';

describe('Turn Timer and Forfeit Handling', () => {
  let game: GameState;
  let gameCode: GameCode;

  beforeEach(() => {
    gameCode = generateGameCode();
    game = Game.createGame(gameCode, 'Host');
  });

  describe('forfeitRound', () => {
    let startedGame: GameState;
    let player1Id: PlayerId;

    beforeEach(() => {
      const p1Result = Game.addPlayer(game, 'Player1');
      if (p1Result.isErr()) throw new Error('Failed to add player');
      player1Id = p1Result.value.playerId;

      const startResult = Game.startGame(p1Result.value.game, game.hostId);
      if (startResult.isErr()) throw new Error('Failed to start game');
      startedGame = startResult.value;
    });

    it('should remove one die from forfeiting player', () => {
      const playerBefore = startedGame.players.find(p => p.id === player1Id);
      const diceBefore = playerBefore?.remainingDice ?? 0;

      const result = Game.forfeitRound(startedGame, player1Id);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        const playerAfter = result.value.game.players.find(p => p.id === player1Id);
        expect(playerAfter?.remainingDice).to.equal(diceBefore - 1);
      }
    });

    it('should transition to POST_ROUND stage', () => {
      const result = Game.forfeitRound(startedGame, player1Id);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.game.stage).to.equal(GameStage.POST_ROUND);
        expect(result.value.loserOut).to.be.false;
        expect(result.value.gameOver).to.be.false;
      }
    });

    it('should eliminate player when they reach 0 dice', () => {
      let currentGame = startedGame;
      const player = currentGame.players.find(p => p.id === player1Id)!;

      for (let i = 0; i < player.remainingDice - 1; i++) {
        const result = Game.forfeitRound(currentGame, player1Id);
        if (result.isErr()) throw new Error('Failed to forfeit');
        currentGame = {
          ...result.value.game,
          stage: GameStage.ROUND_ROBIN,
        };
      }

      const result = Game.forfeitRound(currentGame, player1Id);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.loserOut).to.be.true;
        const playerExists = result.value.game.players.some(p => p.id === player1Id);
        expect(playerExists).to.be.false;
      }
    });

    it('should end game when only one player remains', () => {
      let currentGame = startedGame;
      const player = currentGame.players.find(p => p.id === player1Id)!;

      for (let i = 0; i < player.remainingDice; i++) {
        const result = Game.forfeitRound(currentGame, player1Id);
        if (result.isErr()) throw new Error('Failed to forfeit');

        if (i < player.remainingDice - 1) {
          currentGame = {
            ...result.value.game,
            stage: GameStage.ROUND_ROBIN,
          };
        } else {
          expect(result.value.gameOver).to.be.true;
          expect(result.value.game.stage).to.equal(GameStage.POST_GAME);
        }
      }
    });

    it('should fail for non-existent player', () => {
      const result = Game.forfeitRound(startedGame, 'nonexistent' as PlayerId);

      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.PLAYER_NOT_FOUND);
      }
    });
  });

  describe('sanitizeGameStateForPlayer', () => {
    it('should hide other players dice', () => {
      const p1Result = Game.addPlayer(game, 'Player1');
      if (p1Result.isErr()) throw new Error('Failed to add player');

      const startResult = Game.startGame(p1Result.value.game, game.hostId);
      if (startResult.isErr()) throw new Error('Failed to start game');

      const sanitized = Game.sanitizeGameStateForPlayer(startResult.value, game.hostId);

      const hostPlayer = sanitized.players.find(p => p.id === game.hostId);
      const otherPlayer = sanitized.players.find(p => p.id === p1Result.value.playerId);

      expect(hostPlayer?.dice.length).to.be.greaterThan(0);
      expect(otherPlayer?.dice).to.deep.equal([]);
    });

    it('should preserve all other game state', () => {
      const p1Result = Game.addPlayer(game, 'Player1');
      if (p1Result.isErr()) throw new Error('Failed to add player');

      const startResult = Game.startGame(p1Result.value.game, game.hostId);
      if (startResult.isErr()) throw new Error('Failed to start game');
      const original = startResult.value;

      const sanitized = Game.sanitizeGameStateForPlayer(original, game.hostId);

      expect(sanitized.gameCode).to.equal(original.gameCode);
      expect(sanitized.hostId).to.equal(original.hostId);
      expect(sanitized.stage).to.equal(original.stage);
      expect(sanitized.currentTurnIndex).to.equal(original.currentTurnIndex);
      expect(sanitized.players.length).to.equal(original.players.length);
    });
  });

  describe('removePlayer and host reassignment', () => {
    it('should reassign host to first remaining player when host leaves', () => {
      const p1Result = Game.addPlayer(game, 'Player1');
      if (p1Result.isErr()) throw new Error('Failed to add player');
      const player1Id = p1Result.value.playerId;

      const result = Game.removePlayer(p1Result.value.game, game.hostId);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.newHostId).to.equal(player1Id);
        expect(result.value.game.hostId).to.equal(player1Id);
      }
    });

    it('should not reassign host when non-host player leaves', () => {
      const p1Result = Game.addPlayer(game, 'Player1');
      if (p1Result.isErr()) throw new Error('Failed to add player');

      const result = Game.removePlayer(p1Result.value.game, p1Result.value.playerId);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.newHostId).to.be.null;
        expect(result.value.game.hostId).to.equal(game.hostId);
      }
    });

    it('should return null newHostId when last player leaves', () => {
      const result = Game.removePlayer(game, game.hostId);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.newHostId).to.be.null;
        expect(result.value.game.players).to.have.lengthOf(0);
      }
    });

    it('should reassign host during PRE_GAME stage', () => {
      const p1Result = Game.addPlayer(game, 'Player1');
      if (p1Result.isErr()) throw new Error('Failed to add player');
      const p2Result = Game.addPlayer(p1Result.value.game, 'Player2');
      if (p2Result.isErr()) throw new Error('Failed to add player');

      expect(p2Result.value.game.stage).to.equal(GameStage.PRE_GAME);

      const result = Game.removePlayer(p2Result.value.game, game.hostId);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.newHostId).to.equal(p1Result.value.playerId);
        expect(result.value.game.hostId).to.equal(p1Result.value.playerId);
        expect(result.value.game.players).to.have.lengthOf(2);
      }
    });
  });
});

describe('TurnTimerService', () => {
  let timerService: TurnTimerService;
  let gameCode: GameCode;
  let playerId: PlayerId;

  beforeEach(() => {
    timerService = new TurnTimerService();
    gameCode = 'test-game-code' as GameCode;
    playerId = 'player-123' as PlayerId;
  });

  afterEach(() => {
    timerService.clearAll();
  });

  describe('startTimer', () => {
    it('should return a deadline in the future', () => {
      const before = Date.now();
      const deadline = timerService.startTimer(playerId, gameCode, () => { });
      const after = Date.now();

      expect(deadline.getTime()).to.be.greaterThanOrEqual(before + TURN_TIMEOUT_MS);
      expect(deadline.getTime()).to.be.lessThanOrEqual(after + TURN_TIMEOUT_MS);
    });

    it('should track current turn player', () => {
      timerService.startTimer(playerId, gameCode, () => { });

      expect(timerService.getCurrentTurnPlayer(gameCode)).to.equal(playerId);
    });

    it('should track deadline', () => {
      const deadline = timerService.startTimer(playerId, gameCode, () => { });

      expect(timerService.getDeadline(gameCode)).to.deep.equal(deadline);
    });

    it('should replace existing timer for same game', () => {
      const player1 = 'player-1' as PlayerId;
      const player2 = 'player-2' as PlayerId;

      timerService.startTimer(player1, gameCode, () => { });
      timerService.startTimer(player2, gameCode, () => { });

      expect(timerService.getCurrentTurnPlayer(gameCode)).to.equal(player2);
    });
  });

  describe('cancelTimer', () => {
    it('should cancel active timer', () => {
      timerService.startTimer(playerId, gameCode, () => { });

      const result = timerService.cancelTimer(gameCode);

      expect(result).to.be.true;
      expect(timerService.getCurrentTurnPlayer(gameCode)).to.be.null;
      expect(timerService.getDeadline(gameCode)).to.be.null;
    });

    it('should return false if no timer exists', () => {
      const result = timerService.cancelTimer(gameCode);

      expect(result).to.be.false;
    });
  });

  describe('timer callback', function () {
    this.timeout(5000);

    it('should call callback after timeout', (done) => {
      const shortTimeoutService = new (class extends TurnTimerService {
        startTimer(pId: PlayerId, gCode: GameCode, callback: (p: PlayerId, g: GameCode) => void): Date {
          this.cancelTimer(gCode);
          const deadline = new Date(Date.now() + 50);
          const timer = setTimeout(() => {
            (this as any).activeTimers.delete(gCode);
            callback(pId, gCode);
          }, 50);
          (this as any).activeTimers.set(gCode, { playerId: pId, gameCode: gCode, timer, deadline });
          return deadline;
        }
      })();

      shortTimeoutService.startTimer(playerId, gameCode, (pId, gCode) => {
        expect(pId).to.equal(playerId);
        expect(gCode).to.equal(gameCode);
        shortTimeoutService.clearAll();
        done();
      });
    });
  });
});
