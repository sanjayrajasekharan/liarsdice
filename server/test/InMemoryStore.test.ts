import { expect } from 'chai';
import InMemoryStore from '../src/store/InMemoryStore.js';
import { GameCode, GameState, GameStage, DEFAULT_GAME_SETTINGS, PlayerId } from 'shared/domain.js';
import { ErrorCode } from 'shared/errors.js';

describe('InMemoryStore', () => {
  let store: InMemoryStore;
  let testGame: GameState;
  let gameCode: GameCode;

  beforeEach(() => {
    store = new InMemoryStore();
    gameCode = 'TEST01' as GameCode;
    testGame = {
      gameCode,
      hostId: 'host-123' as PlayerId,
      stage: GameStage.PRE_GAME,
      players: [
        {
          id: 'host-123' as PlayerId,
          name: 'Host',
          remainingDice: 5,
          dice: [],
        },
      ],
      eliminatedPlayers: [],
      claims: [],
      challengeResults: [],
      currentTurnIndex: 0,
      settings: DEFAULT_GAME_SETTINGS,
      turnDeadline: null,
      lastActivityAt: new Date(),
    };
  });

  describe('setGame', () => {
    it('should store a game successfully', () => {
      const result = store.setGame(testGame);

      expect(result.isOk()).to.be.true;
    });

    it('should overwrite existing game with same code', () => {
      store.setGame(testGame);

      const updatedGame = { ...testGame, stage: GameStage.ROUND_ROBIN };
      const result = store.setGame(updatedGame);

      expect(result.isOk()).to.be.true;

      const getResult = store.getGame(gameCode);
      expect(getResult.isOk()).to.be.true;
      if (getResult.isOk()) {
        expect(getResult.value.stage).to.equal(GameStage.ROUND_ROBIN);
      }
    });
  });

  describe('getGame', () => {
    it('should retrieve a stored game', () => {
      store.setGame(testGame);

      const result = store.getGame(gameCode);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.gameCode).to.equal(gameCode);
        expect(result.value.hostId).to.equal(testGame.hostId);
      }
    });

    it('should return error for non-existent game', () => {
      const result = store.getGame('NONEX1' as GameCode);

      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.GAME_NOT_FOUND);
      }
    });
  });

  describe('removeGame', () => {
    it('should remove an existing game', () => {
      store.setGame(testGame);

      const removeResult = store.removeGame(gameCode);
      expect(removeResult.isOk()).to.be.true;

      const getResult = store.getGame(gameCode);
      expect(getResult.isErr()).to.be.true;
    });

    it('should return error when removing non-existent game', () => {
      const result = store.removeGame('NONEX1' as GameCode);

      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.GAME_NOT_FOUND);
      }
    });
  });

  describe('hasGame', () => {
    it('should return true for existing game', () => {
      store.setGame(testGame);

      expect(store.hasGame(gameCode)).to.be.true;
    });

    it('should return false for non-existent game', () => {
      expect(store.hasGame('NONEX1' as GameCode)).to.be.false;
    });

    it('should return false after game is removed', () => {
      store.setGame(testGame);
      store.removeGame(gameCode);

      expect(store.hasGame(gameCode)).to.be.false;
    });
  });

  describe('isolation', () => {
    it('should store multiple games independently', () => {
      const game1 = { ...testGame, gameCode: 'GAME01' as GameCode };
      const game2 = { ...testGame, gameCode: 'GAME02' as GameCode, hostId: 'host-456' as PlayerId };

      store.setGame(game1);
      store.setGame(game2);

      const result1 = store.getGame('GAME01' as GameCode);
      const result2 = store.getGame('GAME02' as GameCode);

      expect(result1.isOk()).to.be.true;
      expect(result2.isOk()).to.be.true;

      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.hostId).to.equal('host-123');
        expect(result2.value.hostId).to.equal('host-456');
      }
    });

    it('should not affect other games when removing one', () => {
      const game1 = { ...testGame, gameCode: 'GAME01' as GameCode };
      const game2 = { ...testGame, gameCode: 'GAME02' as GameCode };

      store.setGame(game1);
      store.setGame(game2);

      store.removeGame('GAME01' as GameCode);

      expect(store.hasGame('GAME01' as GameCode)).to.be.false;
      expect(store.hasGame('GAME02' as GameCode)).to.be.true;
    });
  });
});
