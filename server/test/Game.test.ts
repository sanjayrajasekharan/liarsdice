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

    it('should end game when challenge eliminates last opponent', () => {
      const addResult = Game.addPlayer(game, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      let currentGame = addResult.value.game;
      const player2Id = addResult.value.playerId;

      currentGame = {
        ...currentGame,
        players: currentGame.players.map(p =>
          p.id === player2Id ? { ...p, remainingDice: 1, dice: [1 as DieFace] } : { ...p, dice: [2 as DieFace, 2 as DieFace, 2 as DieFace, 2 as DieFace, 2 as DieFace] }
        ),
        stage: GameStage.ROUND_ROBIN,
        currentTurnIndex: 0,
      };

      const claimingPlayer = currentGame.players[currentGame.currentTurnIndex].id;
      const claim: Claim = { playerId: claimingPlayer, quantity: 5, faceValue: 2 as DieFace };
      const claimResult = Game.addClaim(currentGame, claim);
      if (claimResult.isErr()) throw new Error('Failed to add claim');

      const challengingPlayer = claimResult.value.players[claimResult.value.currentTurnIndex].id;
      expect(challengingPlayer).to.equal(player2Id);

      const result = Game.challenge(claimResult.value, challengingPlayer);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.result.loserOut).to.be.true;
        expect(result.value.result.loserId).to.equal(player2Id);
        expect(result.value.result.gameOver).to.be.true;
        expect(result.value.game.stage).to.equal(GameStage.POST_GAME);
        expect(result.value.game.players).to.have.lengthOf(1);
        expect(result.value.game.eliminatedPlayers).to.include(player2Id);
      }
    });

    it('should end game after multiple rounds when last opponent eliminated', () => {
      const addResult = Game.addPlayer(game, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      let currentGame = addResult.value.game;
      const player1Id = currentGame.hostId;
      const player2Id = addResult.value.playerId;

      currentGame = {
        ...currentGame,
        players: currentGame.players.map(p => ({
          ...p,
          remainingDice: 2,
          dice: p.id === player1Id ? [2 as DieFace, 2 as DieFace] : [1 as DieFace, 1 as DieFace]
        })),
        stage: GameStage.ROUND_ROBIN,
        currentTurnIndex: 0,
      };

      // Round 1: player1 claims, player2 challenges and loses
      let claim: Claim = { playerId: player1Id, quantity: 2, faceValue: 2 as DieFace };
      let claimResult = Game.addClaim(currentGame, claim);
      if (claimResult.isErr()) throw new Error('Failed to add claim');
      currentGame = claimResult.value;

      let challengeResult = Game.challenge(currentGame, player2Id);
      if (challengeResult.isErr()) throw new Error('Failed to challenge');

      expect(challengeResult.value.result.loserId).to.equal(player2Id);
      expect(challengeResult.value.result.loserOut).to.be.false;
      expect(challengeResult.value.result.gameOver).to.be.false;
      expect(challengeResult.value.game.stage).to.equal(GameStage.POST_ROUND);

      // Start round 2
      currentGame = {
        ...challengeResult.value.game,
        players: challengeResult.value.game.players.map(p => ({
          ...p,
          dice: p.id === player1Id ? [2 as DieFace, 2 as DieFace] : [1 as DieFace]
        })),
        stage: GameStage.ROUND_ROBIN,
        claims: [],
      };

      // Round 2: player1 claims again, player2 challenges and loses (eliminated)
      claim = { playerId: player1Id, quantity: 2, faceValue: 2 as DieFace };
      claimResult = Game.addClaim(currentGame, claim);
      if (claimResult.isErr()) throw new Error('Failed to add claim in round 2');
      currentGame = claimResult.value;

      challengeResult = Game.challenge(currentGame, player2Id);
      if (challengeResult.isErr()) throw new Error('Failed to challenge in round 2');

      expect(challengeResult.value.result.loserId).to.equal(player2Id);
      expect(challengeResult.value.result.loserOut).to.be.true;
      expect(challengeResult.value.result.gameOver).to.be.true;
      expect(challengeResult.value.game.stage).to.equal(GameStage.POST_GAME);
      expect(challengeResult.value.game.players).to.have.lengthOf(1);
    });
  });

  describe('wildcard ones', () => {
    it('should include ones in actualTotal when claiming a non-one face', () => {
      const addResult = Game.addPlayer(game, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      let currentGame = addResult.value.game;
      const player1Id = currentGame.hostId;
      const player2Id = addResult.value.playerId;

      currentGame = {
        ...currentGame,
        players: currentGame.players.map(p => ({
          ...p,
          remainingDice: 5,
          dice: p.id === player1Id
            ? [3 as DieFace, 3 as DieFace, 1 as DieFace, 4 as DieFace, 5 as DieFace]
            : [3 as DieFace, 1 as DieFace, 1 as DieFace, 6 as DieFace, 2 as DieFace],
        })),
        stage: GameStage.ROUND_ROBIN,
        currentTurnIndex: 0,
      };

      const claimingPlayer = currentGame.players[currentGame.currentTurnIndex].id;
      const claim: Claim = { playerId: claimingPlayer, quantity: 4, faceValue: 3 as DieFace };
      const claimResult = Game.addClaim(currentGame, claim);
      if (claimResult.isErr()) throw new Error('Failed to add claim');

      const challengingPlayer = claimResult.value.players[claimResult.value.currentTurnIndex].id;
      const result = Game.challenge(claimResult.value, challengingPlayer);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        // Player1: two 3s + one 1 = 3 matching; Player2: one 3 + two 1s = 3 matching
        // actualTotal = 6 (three 3s + three 1s)
        expect(result.value.result.actualTotal).to.equal(6);
      }
    });

    it('should populate playerCounts with only the claimed face (excluding ones)', () => {
      const addResult = Game.addPlayer(game, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      let currentGame = addResult.value.game;
      const player1Id = currentGame.hostId;
      const player2Id = addResult.value.playerId;

      currentGame = {
        ...currentGame,
        players: currentGame.players.map(p => ({
          ...p,
          remainingDice: 3,
          dice: p.id === player1Id
            ? [4 as DieFace, 1 as DieFace, 4 as DieFace]
            : [1 as DieFace, 4 as DieFace, 6 as DieFace],
        })),
        stage: GameStage.ROUND_ROBIN,
        currentTurnIndex: 0,
      };

      const claimingPlayer = currentGame.players[currentGame.currentTurnIndex].id;
      const claim: Claim = { playerId: claimingPlayer, quantity: 3, faceValue: 4 as DieFace };
      const claimResult = Game.addClaim(currentGame, claim);
      if (claimResult.isErr()) throw new Error('Failed to add claim');

      const challengingPlayer = claimResult.value.players[claimResult.value.currentTurnIndex].id;
      const result = Game.challenge(claimResult.value, challengingPlayer);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        const p1Counts = result.value.result.playerCounts.find(p => p.playerId === player1Id);
        const p2Counts = result.value.result.playerCounts.find(p => p.playerId === player2Id);

        expect(p1Counts!.count).to.equal(2);
        expect(p2Counts!.count).to.equal(1);
      }
    });

    it('should populate playerCountsOnes with only the count of ones per player', () => {
      const addResult = Game.addPlayer(game, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      let currentGame = addResult.value.game;
      const player1Id = currentGame.hostId;
      const player2Id = addResult.value.playerId;

      currentGame = {
        ...currentGame,
        players: currentGame.players.map(p => ({
          ...p,
          remainingDice: 3,
          dice: p.id === player1Id
            ? [4 as DieFace, 1 as DieFace, 4 as DieFace]
            : [1 as DieFace, 4 as DieFace, 1 as DieFace],
        })),
        stage: GameStage.ROUND_ROBIN,
        currentTurnIndex: 0,
      };

      const claimingPlayer = currentGame.players[currentGame.currentTurnIndex].id;
      const claim: Claim = { playerId: claimingPlayer, quantity: 3, faceValue: 4 as DieFace };
      const claimResult = Game.addClaim(currentGame, claim);
      if (claimResult.isErr()) throw new Error('Failed to add claim');

      const challengingPlayer = claimResult.value.players[claimResult.value.currentTurnIndex].id;
      const result = Game.challenge(claimResult.value, challengingPlayer);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        const p1Ones = result.value.result.playerCountsOnes.find(p => p.playerId === player1Id);
        const p2Ones = result.value.result.playerCountsOnes.find(p => p.playerId === player2Id);

        expect(p1Ones!.count).to.equal(1);
        expect(p2Ones!.count).to.equal(2);
      }
    });

    it('should have actualTotal equal to sum of playerCounts + playerCountsOnes', () => {
      const addResult = Game.addPlayer(game, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      const addResult2 = Game.addPlayer(addResult.value.game, 'Player3');
      if (addResult2.isErr()) throw new Error('Failed to add player');
      let currentGame = addResult2.value.game;
      const player1Id = currentGame.hostId;

      currentGame = {
        ...currentGame,
        players: currentGame.players.map((p, idx) => ({
          ...p,
          remainingDice: 4,
          dice: idx === 0
            ? [5 as DieFace, 1 as DieFace, 5 as DieFace, 1 as DieFace]
            : idx === 1
            ? [5 as DieFace, 2 as DieFace, 1 as DieFace, 3 as DieFace]
            : [1 as DieFace, 1 as DieFace, 6 as DieFace, 5 as DieFace],
        })),
        stage: GameStage.ROUND_ROBIN,
        currentTurnIndex: 0,
      };

      const claimingPlayer = currentGame.players[currentGame.currentTurnIndex].id;
      const claim: Claim = { playerId: claimingPlayer, quantity: 5, faceValue: 5 as DieFace };
      const claimResult = Game.addClaim(currentGame, claim);
      if (claimResult.isErr()) throw new Error('Failed to add claim');

      const challengingPlayer = claimResult.value.players[claimResult.value.currentTurnIndex].id;
      const result = Game.challenge(claimResult.value, challengingPlayer);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        const totalFace = result.value.result.playerCounts.reduce((sum, p) => sum + p.count, 0);
        const totalOnes = result.value.result.playerCountsOnes.reduce((sum, p) => sum + p.count, 0);
        expect(result.value.result.actualTotal).to.equal(totalFace + totalOnes);
        // P1: two 5s + two 1s = 4; P2: one 5 + one 1 = 2; P3: one 5 + two 1s = 3; total = 9
        expect(result.value.result.actualTotal).to.equal(9);
      }
    });

    it('should count zero ones for players with no ones', () => {
      const addResult = Game.addPlayer(game, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      let currentGame = addResult.value.game;
      const player1Id = currentGame.hostId;
      const player2Id = addResult.value.playerId;

      currentGame = {
        ...currentGame,
        players: currentGame.players.map(p => ({
          ...p,
          remainingDice: 3,
          dice: p.id === player1Id
            ? [3 as DieFace, 3 as DieFace, 3 as DieFace]
            : [2 as DieFace, 4 as DieFace, 6 as DieFace],
        })),
        stage: GameStage.ROUND_ROBIN,
        currentTurnIndex: 0,
      };

      const claimingPlayer = currentGame.players[currentGame.currentTurnIndex].id;
      const claim: Claim = { playerId: claimingPlayer, quantity: 2, faceValue: 3 as DieFace };
      const claimResult = Game.addClaim(currentGame, claim);
      if (claimResult.isErr()) throw new Error('Failed to add claim');

      const challengingPlayer = claimResult.value.players[claimResult.value.currentTurnIndex].id;
      const result = Game.challenge(claimResult.value, challengingPlayer);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        result.value.result.playerCountsOnes.forEach(p => {
          expect(p.count).to.equal(0);
        });
        expect(result.value.result.actualTotal).to.equal(3);
      }
    });

    it('should let challenger win when ones are not enough to meet the claim', () => {
      const addResult = Game.addPlayer(game, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      let currentGame = addResult.value.game;
      const player1Id = currentGame.hostId;
      const player2Id = addResult.value.playerId;

      currentGame = {
        ...currentGame,
        players: currentGame.players.map(p => ({
          ...p,
          remainingDice: 3,
          dice: p.id === player1Id
            ? [2 as DieFace, 1 as DieFace, 6 as DieFace]
            : [1 as DieFace, 4 as DieFace, 6 as DieFace],
        })),
        stage: GameStage.ROUND_ROBIN,
        currentTurnIndex: 0,
      };

      // Claim 4 fives — actual: 0 fives + 2 ones = 2 < 4, challenger wins
      const claimingPlayer = currentGame.players[currentGame.currentTurnIndex].id;
      const claim: Claim = { playerId: claimingPlayer, quantity: 4, faceValue: 5 as DieFace };
      const claimResult = Game.addClaim(currentGame, claim);
      if (claimResult.isErr()) throw new Error('Failed to add claim');

      const challengingPlayer = claimResult.value.players[claimResult.value.currentTurnIndex].id;
      const result = Game.challenge(claimResult.value, challengingPlayer);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.result.actualTotal).to.equal(2);
        expect(result.value.result.winnerId).to.equal(challengingPlayer);
      }
    });

    it('should let claimer win when ones push the total to meet the claim', () => {
      const addResult = Game.addPlayer(game, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      let currentGame = addResult.value.game;
      const player1Id = currentGame.hostId;
      const player2Id = addResult.value.playerId;

      currentGame = {
        ...currentGame,
        players: currentGame.players.map(p => ({
          ...p,
          remainingDice: 4,
          dice: p.id === player1Id
            ? [5 as DieFace, 1 as DieFace, 1 as DieFace, 3 as DieFace]
            : [5 as DieFace, 5 as DieFace, 1 as DieFace, 6 as DieFace],
        })),
        stage: GameStage.ROUND_ROBIN,
        currentTurnIndex: 0,
      };

      // Claim 6 fives — actual: 3 fives + 3 ones = 6 >= 6, claimer wins
      const claimingPlayer = currentGame.players[currentGame.currentTurnIndex].id;
      const claim: Claim = { playerId: claimingPlayer, quantity: 6, faceValue: 5 as DieFace };
      const claimResult = Game.addClaim(currentGame, claim);
      if (claimResult.isErr()) throw new Error('Failed to add claim');

      const challengingPlayer = claimResult.value.players[claimResult.value.currentTurnIndex].id;
      const result = Game.challenge(claimResult.value, challengingPlayer);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.result.actualTotal).to.equal(6);
        expect(result.value.result.winnerId).to.equal(claimingPlayer);
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

  describe('reorderPlayers', () => {
    it('should reorder players when called by host', () => {
      let currentGame = game;
      const addResult1 = Game.addPlayer(currentGame, 'Player2');
      if (addResult1.isErr()) throw new Error('Failed to add player');
      currentGame = addResult1.value.game;
      const player2Id = addResult1.value.playerId;

      const addResult2 = Game.addPlayer(currentGame, 'Player3');
      if (addResult2.isErr()) throw new Error('Failed to add player');
      currentGame = addResult2.value.game;
      const player3Id = addResult2.value.playerId;

      const hostId = currentGame.hostId;
      const newOrder = [player3Id, player2Id, hostId];

      const result = Game.reorderPlayers(currentGame, hostId, newOrder);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.players[0].id).to.equal(player3Id);
        expect(result.value.players[1].id).to.equal(player2Id);
        expect(result.value.players[2].id).to.equal(hostId);
      }
    });

    it('should reject reorder from non-host', () => {
      let currentGame = game;
      const addResult = Game.addPlayer(currentGame, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      currentGame = addResult.value.game;
      const player2Id = addResult.value.playerId;

      const newOrder = [player2Id, currentGame.hostId];
      const result = Game.reorderPlayers(currentGame, player2Id, newOrder);

      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.UNAUTHORIZED);
      }
    });

    it('should reject reorder during active game', () => {
      let currentGame = game;
      const addResult = Game.addPlayer(currentGame, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      currentGame = addResult.value.game;

      const startResult = Game.startGame(currentGame, currentGame.hostId);
      if (startResult.isErr()) throw new Error('Failed to start game');
      currentGame = startResult.value;

      const newOrder = currentGame.players.map(p => p.id).reverse();
      const result = Game.reorderPlayers(currentGame, currentGame.hostId, newOrder);

      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.GAME_IN_PROGRESS);
      }
    });

    it('should reject reorder with invalid player IDs', () => {
      let currentGame = game;
      const addResult = Game.addPlayer(currentGame, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      currentGame = addResult.value.game;

      const newOrder = [currentGame.hostId, 'invalid-id' as PlayerId];
      const result = Game.reorderPlayers(currentGame, currentGame.hostId, newOrder);

      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.INVALID_REQUEST);
      }
    });
  });

  describe('resetGame', () => {
    it('should reset game to PRE_GAME stage with all players', () => {
      let currentGame = game;
      const addResult = Game.addPlayer(currentGame, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      currentGame = addResult.value.game;

      const startResult = Game.startGame(currentGame, currentGame.hostId);
      if (startResult.isErr()) throw new Error('Failed to start game');
      currentGame = startResult.value;

      const claim: Claim = { playerId: currentGame.players[currentGame.currentTurnIndex].id, quantity: 1, faceValue: 1 as DieFace };
      const claimResult = Game.addClaim(currentGame, claim);
      if (claimResult.isErr()) throw new Error('Failed to add claim');
      currentGame = claimResult.value;

      const challengerId = currentGame.players[currentGame.currentTurnIndex].id;
      const challengeResult = Game.challenge(currentGame, challengerId);
      if (challengeResult.isErr()) throw new Error('Failed to challenge');
      currentGame = challengeResult.value.game;

      if (currentGame.stage !== GameStage.POST_GAME) {
        currentGame = { ...currentGame, stage: GameStage.POST_GAME };
      }

      const result = Game.resetGame(currentGame, currentGame.hostId);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.stage).to.equal(GameStage.PRE_GAME);
        expect(result.value.claims).to.have.lengthOf(0);
        expect(result.value.challengeResults).to.have.lengthOf(0);
        expect(result.value.players.every(p => p.remainingDice === currentGame.settings.startingDice)).to.be.true;
        expect(result.value.players.every(p => p.dice.length === 0)).to.be.true;
        expect(result.value.turnDeadline).to.be.null;
      }
    });

    it('should reject reset from non-host', () => {
      let currentGame = game;
      const addResult = Game.addPlayer(currentGame, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      currentGame = addResult.value.game;
      const player2Id = addResult.value.playerId;

      currentGame = { ...currentGame, stage: GameStage.POST_GAME };

      const result = Game.resetGame(currentGame, player2Id);

      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.UNAUTHORIZED);
      }
    });

    it('should reject reset when not in POST_GAME stage', () => {
      let currentGame = game;
      const addResult = Game.addPlayer(currentGame, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      currentGame = addResult.value.game;

      const result = Game.resetGame(currentGame, currentGame.hostId);

      expect(result.isErr()).to.be.true;
      if (result.isErr()) {
        expect(result.error).to.equal(ErrorCode.INVALID_GAME_STATE);
      }
    });

    it('should preserve game code and host ID', () => {
      let currentGame = game;
      const addResult = Game.addPlayer(currentGame, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      currentGame = addResult.value.game;

      currentGame = { ...currentGame, stage: GameStage.POST_GAME };

      const originalGameCode = currentGame.gameCode;
      const originalHostId = currentGame.hostId;

      const result = Game.resetGame(currentGame, currentGame.hostId);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.gameCode).to.equal(originalGameCode);
        expect(result.value.hostId).to.equal(originalHostId);
      }
    });
  });

  describe('leaveGame', () => {
    it('should remove player from game in PRE_GAME stage', () => {
      let currentGame = game;
      const addResult = Game.addPlayer(currentGame, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      currentGame = addResult.value.game;
      const player2Id = addResult.value.playerId;

      const result = Game.leaveGame(currentGame, player2Id);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.game.players).to.have.lengthOf(1);
        expect(result.value.gameOver).to.be.false;
        expect(result.value.gameDestroyed).to.be.false;
      }
    });

    it('should destroy game when last player leaves', () => {
      const result = Game.leaveGame(game, game.hostId);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.gameDestroyed).to.be.true;
      }
    });

    it('should reassign host when host leaves', () => {
      let currentGame = game;
      const addResult = Game.addPlayer(currentGame, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      currentGame = addResult.value.game;
      const player2Id = addResult.value.playerId;

      const result = Game.leaveGame(currentGame, currentGame.hostId);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.newHostId).to.equal(player2Id);
        expect(result.value.game.hostId).to.equal(player2Id);
      }
    });

    it('should end game when player leaves during active game with 2 players', () => {
      let currentGame = game;
      const addResult = Game.addPlayer(currentGame, 'Player2');
      if (addResult.isErr()) throw new Error('Failed to add player');
      currentGame = addResult.value.game;
      const player2Id = addResult.value.playerId;

      const startResult = Game.startGame(currentGame, currentGame.hostId);
      if (startResult.isErr()) throw new Error('Failed to start game');
      currentGame = startResult.value;

      const result = Game.leaveGame(currentGame, player2Id);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.gameOver).to.be.true;
        expect(result.value.game.stage).to.equal(GameStage.POST_GAME);
        expect(result.value.game.players).to.have.lengthOf(1);
      }
    });

    it('should not end game when player leaves during active game with 3+ players', () => {
      let currentGame = game;
      
      const add1 = Game.addPlayer(currentGame, 'Player2');
      if (add1.isErr()) throw new Error('Failed to add player 2');
      currentGame = add1.value.game;
      const player2Id = add1.value.playerId;

      const add2 = Game.addPlayer(currentGame, 'Player3');
      if (add2.isErr()) throw new Error('Failed to add player 3');
      currentGame = add2.value.game;

      const startResult = Game.startGame(currentGame, currentGame.hostId);
      if (startResult.isErr()) throw new Error('Failed to start game');
      currentGame = startResult.value;

      const result = Game.leaveGame(currentGame, player2Id);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.gameOver).to.be.false;
        expect(result.value.game.stage).to.equal(GameStage.ROUND_ROBIN);
        expect(result.value.game.players).to.have.lengthOf(2);
      }
    });

    it('should adjust turn index when current player leaves', () => {
      let currentGame = game;
      
      const add1 = Game.addPlayer(currentGame, 'Player2');
      if (add1.isErr()) throw new Error('Failed to add player 2');
      currentGame = add1.value.game;

      const add2 = Game.addPlayer(currentGame, 'Player3');
      if (add2.isErr()) throw new Error('Failed to add player 3');
      currentGame = add2.value.game;

      const startResult = Game.startGame(currentGame, currentGame.hostId);
      if (startResult.isErr()) throw new Error('Failed to start game');
      currentGame = startResult.value;

      const currentTurnPlayerId = currentGame.players[currentGame.currentTurnIndex].id;
      const result = Game.leaveGame(currentGame, currentTurnPlayerId);

      expect(result.isOk()).to.be.true;
      if (result.isOk()) {
        expect(result.value.game.currentTurnIndex).to.be.lessThan(result.value.game.players.length);
      }
    });
  });
});
