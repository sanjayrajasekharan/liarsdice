import { expect } from 'chai';
import * as Game from '@app/GameService.js';
import { generateGameCode } from '@app/GameService.js';
import { ErrorCode } from 'shared/errors.js';
import { GameStage, GameCode, GameState } from 'shared/domain.js';

describe('updateSettings', () => {
  let game: GameState;
  let gameCode: GameCode;

  beforeEach(() => {
    gameCode = generateGameCode();
    game = Game.createGame(gameCode, 'Host');
  });

  it('should allow host to update startingDice', () => {
    const result = Game.updateSettings(game, game.hostId, { startingDice: 3 });

    expect(result.isOk()).to.be.true;
    if (result.isOk()) {
      expect(result.value.settings.startingDice).to.equal(3);
    }
  });

  it('should allow host to update turnTimeoutSeconds', () => {
    const result = Game.updateSettings(game, game.hostId, { turnTimeoutSeconds: 60 });

    expect(result.isOk()).to.be.true;
    if (result.isOk()) {
      expect(result.value.settings.turnTimeoutSeconds).to.equal(60);
    }
  });

  it('should allow host to update postRoundDelaySeconds', () => {
    const result = Game.updateSettings(game, game.hostId, { postRoundDelaySeconds: 10 });

    expect(result.isOk()).to.be.true;
    if (result.isOk()) {
      expect(result.value.settings.postRoundDelaySeconds).to.equal(10);
    }
  });

  it('should allow host to enable wildOnesEnabled', () => {
    const result = Game.updateSettings(game, game.hostId, { wildOnesEnabled: true });

    expect(result.isOk()).to.be.true;
    if (result.isOk()) {
      expect(result.value.settings.wildOnesEnabled).to.be.true;
    }
  });

  it('should allow host to disable wildOnesEnabled', () => {
    const enableResult = Game.updateSettings(game, game.hostId, { wildOnesEnabled: true });
    if (enableResult.isErr()) throw new Error('Failed to enable wild ones');

    const result = Game.updateSettings(enableResult.value, game.hostId, { wildOnesEnabled: false });

    expect(result.isOk()).to.be.true;
    if (result.isOk()) {
      expect(result.value.settings.wildOnesEnabled).to.be.false;
    }
  });

  it('should allow updating multiple settings at once', () => {
    const result = Game.updateSettings(game, game.hostId, {
      startingDice: 4,
      turnTimeoutSeconds: 45,
      wildOnesEnabled: true,
    });

    expect(result.isOk()).to.be.true;
    if (result.isOk()) {
      expect(result.value.settings.startingDice).to.equal(4);
      expect(result.value.settings.turnTimeoutSeconds).to.equal(45);
      expect(result.value.settings.wildOnesEnabled).to.be.true;
    }
  });

  it('should update all players remainingDice when startingDice changes', () => {
    const addResult = Game.addPlayer(game, 'Player2');
    if (addResult.isErr()) throw new Error('Failed to add player');

    const result = Game.updateSettings(addResult.value.game, game.hostId, { startingDice: 3 });

    expect(result.isOk()).to.be.true;
    if (result.isOk()) {
      expect(result.value.players.every(p => p.remainingDice === 3)).to.be.true;
    }
  });

  it('should reject settings update from non-host', () => {
    const addResult = Game.addPlayer(game, 'Player2');
    if (addResult.isErr()) throw new Error('Failed to add player');

    const result = Game.updateSettings(addResult.value.game, addResult.value.playerId, { startingDice: 3 });

    expect(result.isErr()).to.be.true;
    if (result.isErr()) {
      expect(result.error).to.equal(ErrorCode.UNAUTHORIZED);
    }
  });

  it('should reject settings update during active game', () => {
    const addResult = Game.addPlayer(game, 'Player2');
    if (addResult.isErr()) throw new Error('Failed to add player');

    const startResult = Game.startGame(addResult.value.game, game.hostId);
    if (startResult.isErr()) throw new Error('Failed to start game');

    const result = Game.updateSettings(startResult.value, game.hostId, { startingDice: 3 });

    expect(result.isErr()).to.be.true;
    if (result.isErr()) {
      expect(result.error).to.equal(ErrorCode.GAME_IN_PROGRESS);
    }
  });

  it('should preserve other settings when updating one', () => {
    const firstUpdate = Game.updateSettings(game, game.hostId, { startingDice: 3 });
    if (firstUpdate.isErr()) throw new Error('Failed first update');

    const result = Game.updateSettings(firstUpdate.value, game.hostId, { turnTimeoutSeconds: 60 });

    expect(result.isOk()).to.be.true;
    if (result.isOk()) {
      expect(result.value.settings.startingDice).to.equal(3);
      expect(result.value.settings.turnTimeoutSeconds).to.equal(60);
    }
  });

  it('should update lastActivityAt timestamp', () => {
    const beforeUpdate = new Date();

    const result = Game.updateSettings(game, game.hostId, { startingDice: 3 });

    expect(result.isOk()).to.be.true;
    if (result.isOk()) {
      expect(result.value.lastActivityAt.getTime()).to.be.at.least(beforeUpdate.getTime());
    }
  });
});
