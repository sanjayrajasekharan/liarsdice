import { expect } from 'chai';
import * as Game from '@app/GameService.js';
import { generateGameCode } from '@app/GameService.js';
import { ErrorCode } from 'shared/errors.js';
import { GameStage, GameCode, PlayerId, GameState, Claim, DieFace } from 'shared/domain.js';

describe('Game', () => {
  let game: GameState;
  let gameCode: GameCode;
  let hostName: string;

  beforeEach(() => {
    hostName = 'Host';
    gameCode = generateGameCode();
    game = Game.createGame(gameCode, hostName);
  });

  describe('addPlayer', () => {
    it('should create a player and add to game', () => {
      const result = Game.addPlayer(game, 'Player1');

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.playerId).to.be.a('string');
        expect(result.value.game.players.length).to.equal(2);
      }
    });

    it('should add player to the players array', () => {
      const result = Game.addPlayer(game, 'Player1');

      if (result.isOk()) {
        const playerIds = result.value.game.players.map(p => p.id);
        expect(playerIds).to.include(result.value.playerId);
      }
    });

    it('should allow up to 6 players including host', () => {
      let currentGame = game;
      for (let i = 2; i <= 6; i++) {
        const result = Game.addPlayer(currentGame, `Player${i}`);
        expect(result.isOk()).to.be.true;
        if (result.isOk()) {
          currentGame = result.value.game;
        }
      }

      expect(currentGame.players.length).to.equal(6);
    });

    it('should reject 7th player', () => {
      let currentGame = game;
      for (let i = 2; i <= 6; i++) {
        const result = Game.addPlayer(currentGame, `Player${i}`);
        if (result.isOk()) {
          currentGame = result.value.game;
        }
      }

      const result = Game.addPlayer(currentGame, 'Player7');

      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.GAME_FULL);
      }
    });

    it('should reject player creation when game is in progress', () => {
      const p1Result = Game.addPlayer(game, 'Player1');
      if (p1Result.isErr()) throw new Error('Failed to add player');

      const startResult = Game.startGame(p1Result.value.game, game.hostId);
      if (startResult.isErr()) throw new Error('Failed to start game');

      const result = Game.addPlayer(startResult.value, 'Player2');
      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.GAME_IN_PROGRESS);
      }
    });
  });

  describe('startGame', () => {
    it('should start a game successfully', () => {
      const playerResult = Game.addPlayer(game, 'Player1');
      if (playerResult.isErr()) throw new Error('Failed to add player');

      const result = Game.startGame(playerResult.value.game, game.hostId);

      expect(result.isOk()).to.be.true;
    });

    it('should transition from PRE_GAME to ROUND_ROBIN stage', () => {
      const p1Result = Game.addPlayer(game, 'Player1');
      if (p1Result.isErr()) throw new Error('Failed to add player');

      const startResult = Game.startGame(p1Result.value.game, game.hostId);
      if (startResult.isErr()) throw new Error('Failed to start game');

      expect(startResult.value.stage).to.equal(GameStage.ROUND_ROBIN);
    });

    it('should clear previous claims when starting', () => {
      const p1Result = Game.addPlayer(game, 'Player1');
      if (p1Result.isErr()) throw new Error('Failed to add player');

      const startResult = Game.startGame(p1Result.value.game, game.hostId);
      if (startResult.isErr()) throw new Error('Failed to start game');

      expect(startResult.value.claims).to.be.an('array').that.is.empty;
    });

    it('should only allow host to start the game', () => {
      const playerResult = Game.addPlayer(game, 'Player1');
      if (playerResult.isErr()) throw new Error('Failed to add player');

      const result = Game.startGame(playerResult.value.game, playerResult.value.playerId);

      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.UNAUTHORIZED);
      }
    });

    it('should reject starting game during ROUND_ROBIN stage', () => {
      const p1Result = Game.addPlayer(game, 'Player1');
      if (p1Result.isErr()) throw new Error('Failed to add player');

      const startResult = Game.startGame(p1Result.value.game, game.hostId);
      if (startResult.isErr()) throw new Error('Failed to start game');

      const result = Game.startGame(startResult.value, game.hostId);

      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.GAME_IN_PROGRESS);
      }
    });
  });

  describe('validateTurn', () => {
    let startedGame: GameState;
    let player1Id: PlayerId;
    let player2Id: PlayerId;

    beforeEach(() => {
      const p1Result = Game.addPlayer(game, 'Player1');
      const p2Result = Game.addPlayer(p1Result.isOk() ? p1Result.value.game : game, 'Player2');

      if (p1Result.isErr() || p2Result.isErr()) {
        throw new Error('Failed to create players');
      }

      player1Id = p1Result.value.playerId;
      player2Id = p2Result.value.playerId;

      const startResult = Game.startGame(p2Result.value.game, game.hostId);
      if (startResult.isErr()) throw new Error('Failed to start game');
      startedGame = startResult.value;
    });

    it('should validate correct turn', () => {
      if (startedGame.currentTurnIndex === undefined) {
        throw new Error('currentTurnIndex should be defined after starting the game');
      }
      const currentPlayerId = startedGame.players[startedGame.currentTurnIndex].id;
      const result = Game.validateTurn(startedGame, currentPlayerId);

      expect(result.isOk()).to.be.true;
    });

    it('should reject out of turn action', () => {
      if (startedGame.currentTurnIndex === undefined) {
        throw new Error('currentTurnIndex should be defined after starting the game');
      }
      const currentPlayerId = startedGame.players[startedGame.currentTurnIndex].id;
      const otherPlayerId = startedGame.players.find(p => p.id !== currentPlayerId)!.id;
      const result = Game.validateTurn(startedGame, otherPlayerId);

      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.OUT_OF_TURN);
      }
    });

    it('should reject turn validation when round is not active', () => {
      const newGame = Game.createGame(generateGameCode(), 'NewHost');
      const playerResult = Game.addPlayer(newGame, 'Player1');
      if (playerResult.isErr()) throw new Error('Failed to add player');

      const result = Game.validateTurn(playerResult.value.game, playerResult.value.playerId);

      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.ROUND_NOT_ACTIVE);
      }
    });
  });

  describe('addClaim', () => {
    let startedGame: GameState;

    beforeEach(() => {
      const p1Result = Game.addPlayer(game, 'Player1');
      const p2Result = Game.addPlayer(p1Result.isOk() ? p1Result.value.game : game, 'Player2');

      if (p1Result.isErr() || p2Result.isErr()) {
        throw new Error('Failed to create players');
      }

      const startResult = Game.startGame(p2Result.value.game, game.hostId);
      if (startResult.isErr()) throw new Error('Failed to start game');
      startedGame = startResult.value;
    });

    it('should add a valid first claim and advance turn', () => {
      if (startedGame.currentTurnIndex === undefined) {
        throw new Error('currentTurnIndex should be defined after starting the game');
      }
      const currentPlayerId = startedGame.players[startedGame.currentTurnIndex].id;
      const claim: Claim = { playerId: currentPlayerId, quantity: 2, faceValue: 3 as DieFace };
      const initialTurnIndex = startedGame.currentTurnIndex;

      const result = Game.addClaim(startedGame, claim);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.claims).to.have.lengthOf(1);
        expect(result.value.currentTurnIndex).to.not.equal(initialTurnIndex);
      }
    });

    it('should add a valid increasing claim and continue turn rotation', () => {
      if (startedGame.currentTurnIndex === undefined) {
        throw new Error('currentTurnIndex should be defined after starting the game');
      }
      const player1 = startedGame.players[startedGame.currentTurnIndex].id;
      const claim1: Claim = { playerId: player1, quantity: 2, faceValue: 3 as DieFace };
      const result1 = Game.addClaim(startedGame, claim1);
      if (result1.isErr()) throw new Error('Failed to add first claim');

      if (result1.value.currentTurnIndex === undefined) {
        throw new Error('currentTurnIndex should be defined after starting the game');
      }

      const player2 = result1.value.players[result1.value.currentTurnIndex].id;
      const claim2: Claim = { playerId: player2, quantity: 3, faceValue: 3 as DieFace };
      const result = Game.addClaim(result1.value, claim2);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.claims).to.have.lengthOf(2);
      }
    });

    it('should reject invalid claim (lower quantity)', () => {
      if (startedGame.currentTurnIndex === undefined) {
        throw new Error('currentTurnIndex should be defined after starting the game');
      }
      const player1 = startedGame.players[startedGame.currentTurnIndex].id;
      const claim1: Claim = { playerId: player1, quantity: 5, faceValue: 3 as DieFace };
      const result1 = Game.addClaim(startedGame, claim1);
      if (result1.isErr()) throw new Error('Failed to add first claim');

      const player2 = result1.value.players[result1.value.currentTurnIndex].id;
      const claim2: Claim = { playerId: player2, quantity: 4, faceValue: 4 as DieFace };
      const result = Game.addClaim(result1.value, claim2);

      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.INVALID_CLAIM);
      }
    });

    it('should reject out of turn claim', () => {
      if (startedGame.currentTurnIndex === undefined) {
        throw new Error('currentTurnIndex should be defined after starting the game');
      }
      const currentPlayer = startedGame.players[startedGame.currentTurnIndex].id;
      const otherPlayer = startedGame.players.find(p => p.id !== currentPlayer)!.id;

      const claim: Claim = { playerId: otherPlayer, quantity: 2, faceValue: 3 as DieFace };
      const result = Game.addClaim(startedGame, claim);

      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.OUT_OF_TURN);
      }
    });
  });

  describe('challenge', () => {
    let startedGame: GameState;

    beforeEach(() => {
      const p1Result = Game.addPlayer(game, 'Player1');
      const p2Result = Game.addPlayer(p1Result.isOk() ? p1Result.value.game : game, 'Player2');

      if (p1Result.isErr() || p2Result.isErr()) {
        throw new Error('Failed to create players');
      }

      const startResult = Game.startGame(p2Result.value.game, game.hostId);
      if (startResult.isErr()) throw new Error('Failed to start game');
      startedGame = startResult.value;
    });

    it('should handle challenge and determine winner/loser', () => {
      if (startedGame.currentTurnIndex === undefined) {
        throw new Error('currentTurnIndex should be defined after starting the game');
      }
      const claimingPlayer = startedGame.players[startedGame.currentTurnIndex].id;
      const claim: Claim = { playerId: claimingPlayer, quantity: 2, faceValue: 3 as DieFace };
      const claimResult = Game.addClaim(startedGame, claim);
      if (claimResult.isErr()) throw new Error('Failed to add claim');

      const challengingPlayer = claimResult.value.players[claimResult.value.currentTurnIndex].id;
      const result = Game.challenge(claimResult.value, challengingPlayer);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.result).to.have.property('winnerId');
        expect(result.value.result).to.have.property('loserId');
      }
    });

    it('should determine winner and loser based on claim accuracy', () => {
      if (startedGame.currentTurnIndex === undefined) {
        throw new Error('currentTurnIndex should be defined after starting the game');
      }
      const claimingPlayer = startedGame.players[startedGame.currentTurnIndex].id;
      const claim: Claim = { playerId: claimingPlayer, quantity: 2, faceValue: 3 as DieFace };
      const claimResult = Game.addClaim(startedGame, claim);
      if (claimResult.isErr()) throw new Error('Failed to add claim');

      const challengingPlayer = claimResult.value.players[claimResult.value.currentTurnIndex].id;
      const result = Game.challenge(claimResult.value, challengingPlayer);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.result.winnerId).to.be.oneOf([claimingPlayer, challengingPlayer]);
        expect(result.value.result.loserId).to.be.oneOf([claimingPlayer, challengingPlayer]);
        expect(result.value.result.winnerId).to.not.equal(result.value.result.loserId);
        expect(result.value.result.loserOut).to.be.a('boolean');
      }
    });

    it("should reject challenge when not player's turn", () => {
      if (startedGame.currentTurnIndex === undefined) {
        throw new Error('currentTurnIndex should be defined after starting the game');
      }
      const claimingPlayer = startedGame.players[startedGame.currentTurnIndex].id;
      const claim: Claim = { playerId: claimingPlayer, quantity: 2, faceValue: 3 as DieFace };
      const claimResult = Game.addClaim(startedGame, claim);
      if (claimResult.isErr()) throw new Error('Failed to add claim');

      const wrongPlayer = claimResult.value.players.find(
        (p, idx) => idx !== claimResult.value.currentTurnIndex
      )!.id;
      const result = Game.challenge(claimResult.value, wrongPlayer);

      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.OUT_OF_TURN);
      }
    });

    it('should set turn to winner after challenge', () => {
      if (startedGame.currentTurnIndex === undefined) {
        throw new Error('currentTurnIndex should be defined after starting the game');
      }
      const claimingPlayer = startedGame.players[startedGame.currentTurnIndex].id;
      const claim: Claim = { playerId: claimingPlayer, quantity: 2, faceValue: 3 as DieFace };
      const claimResult = Game.addClaim(startedGame, claim);
      if (claimResult.isErr()) throw new Error('Failed to add claim');

      const challengingPlayer = claimResult.value.players[claimResult.value.currentTurnIndex].id;
      const result = Game.challenge(claimResult.value, challengingPlayer);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        const currentPlayer = result.value.game.players[result.value.game.currentTurnIndex].id;
        expect(currentPlayer).to.equal(result.value.result.winnerId);
      }
    });
  });

  describe('game flow', () => {
    it('should handle a complete round flow with stage transitions', () => {
      const p1Result = Game.addPlayer(game, 'Player1');
      const p2Result = Game.addPlayer(p1Result.isOk() ? p1Result.value.game : game, 'Player2');

      if (p1Result.isErr() || p2Result.isErr()) {
        throw new Error('Failed to create players');
      }

      const startResult = Game.startGame(p2Result.value.game, game.hostId);
      expect(startResult.isOk()).to.be.true;
      if (startResult.isErr()) throw new Error('Failed to start game');

      let currentGame = startResult.value;
      const firstPlayer = currentGame.players[currentGame.currentTurnIndex].id;
      const claim1: Claim = { playerId: firstPlayer, quantity: 2, faceValue: 3 as DieFace };
      const claim1Result = Game.addClaim(currentGame, claim1);
      expect(claim1Result.isOk()).to.be.true;
      if (claim1Result.isErr()) throw new Error('Failed to add claim 1');
      currentGame = claim1Result.value;

      const secondPlayer = currentGame.players[currentGame.currentTurnIndex].id;
      const claim2: Claim = { playerId: secondPlayer, quantity: 3, faceValue: 3 as DieFace };
      const claim2Result = Game.addClaim(currentGame, claim2);
      expect(claim2Result.isOk()).to.be.true;
      if (claim2Result.isErr()) throw new Error('Failed to add claim 2');
      currentGame = claim2Result.value;

      const thirdPlayer = currentGame.players[currentGame.currentTurnIndex].id;
      const challengeResult = Game.challenge(currentGame, thirdPlayer);
      expect(challengeResult.isOk()).to.be.true;

      if (challengeResult.isOk()) {
        expect(challengeResult.value.result).to.have.property('winnerId');
        expect(challengeResult.value.result).to.have.property('loserId');
        expect(challengeResult.value.result).to.have.property('loserOut');
      }
    });

    it('should handle turn rotation correctly through multiple claims', () => {
      const p1Result = Game.addPlayer(game, 'Player1');
      const p2Result = Game.addPlayer(p1Result.isOk() ? p1Result.value.game : game, 'Player2');
      if (p1Result.isErr() || p2Result.isErr()) throw new Error('Failed to create players');

      const startResult = Game.startGame(p2Result.value.game, game.hostId);
      if (startResult.isErr()) throw new Error('Failed to start game');

      let currentGame = startResult.value;
      const initialPlayer = currentGame.players[currentGame.currentTurnIndex].id;
      const claim1: Claim = { playerId: initialPlayer, quantity: 2, faceValue: 3 as DieFace };
      const result1 = Game.addClaim(currentGame, claim1);
      if (result1.isErr()) throw new Error('Failed to add first claim');
      currentGame = result1.value;

      const secondPlayer = currentGame.players[currentGame.currentTurnIndex].id;
      expect(secondPlayer).to.not.equal(initialPlayer);

      const claim2: Claim = { playerId: secondPlayer, quantity: 3, faceValue: 3 as DieFace };
      const result2 = Game.addClaim(currentGame, claim2);
      if (result2.isErr()) throw new Error('Failed to add second claim');
      currentGame = result2.value;

      const thirdPlayer = currentGame.players[currentGame.currentTurnIndex].id;
      expect(thirdPlayer).to.not.equal(secondPlayer);
    });
  });
});
