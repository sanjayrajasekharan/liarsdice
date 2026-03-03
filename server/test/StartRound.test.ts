import { expect } from 'chai';
import * as Game from '@app/GameService.js';
import { generateGameCode } from '@app/GameService.js';
import { ErrorCode } from 'shared/errors.js';
import { GameStage, GameCode, GameState, PlayerId, DieFace, Claim } from 'shared/domain.js';

describe('startRound', () => {
  let game: GameState;
  let gameCode: GameCode;

  beforeEach(() => {
    gameCode = generateGameCode();
    game = Game.createGame(gameCode, 'Host');
  });

  describe('from PRE_GAME stage', () => {
    it('should transition to ROUND_ROBIN stage', () => {
      const addResult = Game.addPlayer(game, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');

      const result = Game.startRound(addResult.value.game);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.stage).to.equal(GameStage.ROUND_ROBIN);
      }
    });

    it('should roll dice for all players', () => {
      const addResult = Game.addPlayer(game, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');

      const result = Game.startRound(addResult.value.game);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        for (const player of result.value.players) {
          expect(player.dice).to.have.lengthOf(player.remainingDice);
          for (const die of player.dice) {
            expect(die).to.be.at.least(1);
            expect(die).to.be.at.most(6);
          }
        }
      }
    });

    it('should clear claims array', () => {
      const addResult = Game.addPlayer(game, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');

      const result = Game.startRound(addResult.value.game);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.claims).to.be.an('array').that.is.empty;
      }
    });

    it('should reject with less than 2 players', () => {
      const result = Game.startRound(game);

      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.NOT_ENOUGH_PLAYERS);
      }
    });
  });

  describe('from POST_ROUND stage', () => {
    let postRoundGame: GameState;
    let player2Id: PlayerId;

    beforeEach(() => {
      const addResult = Game.addPlayer(game, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      player2Id = addResult.value.playerId;

      const startResult = Game.startGame(addResult.value.game, game.hostId);
      if (startResult.isErr()) throw new Error('Failed to start game');

      let currentGame = startResult.value;
      const claimingPlayer = currentGame.players[currentGame.currentTurnIndex].id;
      const claim: Claim = { playerId: claimingPlayer, quantity: 2, faceValue: 3 as DieFace };
      const claimResult = Game.addClaim(currentGame, claim);
      if (claimResult.isErr()) throw new Error('Failed to add claim');

      const challengingPlayer = claimResult.value.players[claimResult.value.currentTurnIndex].id;
      const challengeResult = Game.challenge(claimResult.value, challengingPlayer);
      if (challengeResult.isErr()) throw new Error('Failed to challenge');

      if (challengeResult.value.game.stage !== GameStage.POST_ROUND) {
        postRoundGame = { ...challengeResult.value.game, stage: GameStage.POST_ROUND };
      } else {
        postRoundGame = challengeResult.value.game;
      }
    });

    it('should transition from POST_ROUND to ROUND_ROBIN', () => {
      const result = Game.startRound(postRoundGame);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.stage).to.equal(GameStage.ROUND_ROBIN);
      }
    });

    it('should roll new dice for remaining players', () => {
      const result = Game.startRound(postRoundGame);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        for (const player of result.value.players) {
          expect(player.dice).to.have.lengthOf(player.remainingDice);
        }
      }
    });

    it('should clear claims from previous round', () => {
      const result = Game.startRound(postRoundGame);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.claims).to.be.an('array').that.is.empty;
      }
    });
  });

  describe('invalid stage transitions', () => {
    it('should reject from ROUND_ROBIN stage', () => {
      const addResult = Game.addPlayer(game, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');

      const startResult = Game.startGame(addResult.value.game, game.hostId);
      if (startResult.isErr()) throw new Error('Failed to start game');

      const result = Game.startRound(startResult.value);

      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.INVALID_GAME_STATE);
      }
    });

    it('should reject from POST_GAME stage', () => {
      const addResult = Game.addPlayer(game, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');

      const postGameState: GameState = {
        ...addResult.value.game,
        stage: GameStage.POST_GAME,
      };

      const result = Game.startRound(postGameState);

      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.INVALID_GAME_STATE);
      }
    });
  });

  it('should update lastActivityAt timestamp', () => {
    const addResult = Game.addPlayer(game, 'Player2');
    if (addResult.isErr()) throw new Error('Failed to add player');

    const beforeStart = new Date();
    const result = Game.startRound(addResult.value.game);

    expect(result.isOk()).to.be.true;
    if (result.isOk()) {
      expect(result.value.lastActivityAt.getTime()).to.be.at.least(beforeStart.getTime());
    }
  });
});
