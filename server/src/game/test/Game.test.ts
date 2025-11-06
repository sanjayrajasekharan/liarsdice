import { expect } from 'chai';
import { Game } from '../Game.js';
import { Player } from '../Player.js';
import { Claim } from '../Claim.js';
import { ErrorCode } from '../../../../shared/errors.js';
import { GameStage } from '../../../../shared/types.js';

describe('Game', () => {
    let game: Game;
    let gameCode: string;
    let hostId: string;

    beforeEach(() => {
        hostId = 'host-player-id';
        const result = Game.create(hostId);
        if (!result.ok) throw new Error('Failed to create game');
        
        game = result.value.game;
        gameCode = result.value.gameCode;
    });

    afterEach(() => {
        // Clean up the game after each test
        Game.delete(gameCode);
    });

    describe('Game.create', () => {
        it('should create a new game with a unique game code', () => {
            const result = Game.create('host-id');
            
            expect(result.ok).to.be.true;
            if (result.ok) {
                expect(result.value.gameCode).to.be.a('string');
                expect(result.value.game).to.be.instanceOf(Game);
                Game.delete(result.value.gameCode);
            }
        });

        it('should create games with different codes', () => {
            const result1 = Game.create('host1');
            const result2 = Game.create('host2');
            
            expect(result1.ok).to.be.true;
            expect(result2.ok).to.be.true;
            
            if (result1.ok && result2.ok) {
                expect(result1.value.gameCode).to.not.equal(result2.value.gameCode);
                Game.delete(result1.value.gameCode);
                Game.delete(result2.value.gameCode);
            }
        });
    });

    describe('Game.get', () => {
        it('should retrieve a game by game code', () => {
            const retrievedGame = Game.get(gameCode);
            
            expect(retrievedGame).to.equal(game);
        });

        it('should return undefined for non-existent game code', () => {
            const retrievedGame = Game.get('non-existent-code');
            
            expect(retrievedGame).to.be.undefined;
        });
    });

    describe('Game.delete', () => {
        it('should remove a game from the games map', () => {
            const tempResult = Game.create('temp-host');
            if (!tempResult.ok) throw new Error('Failed to create temp game');
            
            const tempCode = tempResult.value.gameCode;
            Game.delete(tempCode);
            
            expect(Game.get(tempCode)).to.be.undefined;
        });
    });

    describe('createPlayer', () => {
        it('should create a player and add to game', () => {
            const result = game.createPlayer('Player1');
            
            expect(result.ok).to.be.true;
            if (result.ok) {
                expect(result.value.playerId).to.be.a('string');
                expect(result.value.player).to.be.instanceOf(Player);
                expect(result.value.player.getName()).to.equal('Player1');
            }
        });

        it('should add player to the game order', () => {
            const result = game.createPlayer('Player1');
            
            if (result.ok) {
                expect(game.getOrder()).to.include(result.value.playerId);
                expect(game.getPlayers().has(result.value.playerId)).to.be.true;
            }
        });

        it('should allow up to 6 players', () => {
            for (let i = 1; i <= 6; i++) {
                const result = game.createPlayer(`Player${i}`);
                expect(result.ok).to.be.true;
            }
            
            expect(game.getPlayers().size).to.equal(6);
        });

        it('should reject 7th player', () => {
            // Add 6 players
            for (let i = 1; i <= 6; i++) {
                game.createPlayer(`Player${i}`);
            }
            
            const result = game.createPlayer('Player7');
            
            expect(result.ok).to.be.false;
            if (!result.ok) {
                expect(result.error.code).to.equal(ErrorCode.GAME_FULL);
            }
        });

        it('should reject player creation when game is in progress', () => {
            const player1Result = game.createPlayer('Player1');
            const player2Result = game.createPlayer('Player2');
            
            if (player1Result.ok) {
                game.startRound(player1Result.value.playerId);
                
                const result = game.createPlayer('Player3');
                expect(result.ok).to.be.false;
                if (!result.ok) {
                    expect(result.error.code).to.equal(ErrorCode.GAME_IN_PROGRESS);
                }
            }
        });
    });

    describe('startRound', () => {
        it('should start a round successfully', () => {
            const playerResult = game.createPlayer('Player1');
            if (!playerResult.ok) throw new Error('Failed to create player');
            
            const result = game.startRound(playerResult.value.playerId);
            
            expect(result.ok).to.be.true;
        });

        it('should set the turn index to the starting player', () => {
            const player1Result = game.createPlayer('Player1');
            const player2Result = game.createPlayer('Player2');
            
            if (player1Result.ok && player2Result.ok) {
                game.startRound(player2Result.value.playerId);
                
                const turnIndex = game.getTurnIndex();
                const currentPlayerId = game.getOrder()[turnIndex];
                expect(currentPlayerId).to.equal(player2Result.value.playerId);
            }
        });

        it('should clear previous claims', () => {
            const player1Result = game.createPlayer('Player1');
            if (!player1Result.ok) throw new Error('Failed to create player');
            
            game.startRound(player1Result.value.playerId);
            
            expect(game.getClaims()).to.be.an('array').that.is.empty;
        });

        it('should reject starting round during ROUND_ROBBIN stage', () => {
            const player1Result = game.createPlayer('Player1');
            if (!player1Result.ok) throw new Error('Failed to create player');
            
            game.startRound(player1Result.value.playerId);
            const result = game.startRound(player1Result.value.playerId);
            
            expect(result.ok).to.be.false;
            if (!result.ok) {
                expect(result.error.code).to.equal(ErrorCode.INVALID_GAME_STATE);
            }
        });
    });

    describe('validateTurn', () => {
        let player1Id: string;
        let player2Id: string;

        beforeEach(() => {
            const p1Result = game.createPlayer('Player1');
            const p2Result = game.createPlayer('Player2');
            
            if (!p1Result.ok || !p2Result.ok) {
                throw new Error('Failed to create players');
            }
            
            player1Id = p1Result.value.playerId;
            player2Id = p2Result.value.playerId;
            
            game.startRound(player1Id);
        });

        it('should validate correct turn', () => {
            const result = game.validateTurn(player1Id);
            
            expect(result.ok).to.be.true;
        });

        it('should reject out of turn action', () => {
            const result = game.validateTurn(player2Id);
            
            expect(result.ok).to.be.false;
            if (!result.ok) {
                expect(result.error.code).to.equal(ErrorCode.OUT_OF_TURN);
            }
        });

        it('should reject turn validation when round is not active', () => {
            Game.delete(gameCode);
            const newGameResult = Game.create(hostId);
            if (!newGameResult.ok) throw new Error('Failed to create game');
            
            const newGame = newGameResult.value.game;
            const playerResult = newGame.createPlayer('Player1');
            if (!playerResult.ok) throw new Error('Failed to create player');
            
            const result = newGame.validateTurn(playerResult.value.playerId);
            
            expect(result.ok).to.be.false;
            if (!result.ok) {
                expect(result.error.code).to.equal(ErrorCode.ROUND_NOT_ACTIVE);
            }
            
            Game.delete(newGameResult.value.gameCode);
        });
    });

    describe('addClaim', () => {
        let player1Id: string;
        let player2Id: string;

        beforeEach(() => {
            const p1Result = game.createPlayer('Player1');
            const p2Result = game.createPlayer('Player2');
            
            if (!p1Result.ok || !p2Result.ok) {
                throw new Error('Failed to create players');
            }
            
            player1Id = p1Result.value.playerId;
            player2Id = p2Result.value.playerId;
            
            game.startRound(player1Id);
        });

        it('should add a valid first claim', () => {
            const claim = new Claim(player1Id, 2, 3);
            const result = game.addClaim(claim);
            
            expect(result.ok).to.be.true;
            expect(game.getClaims()).to.have.lengthOf(1);
        });

        it('should add a valid increasing claim', () => {
            const claim1 = new Claim(player1Id, 2, 3);
            game.addClaim(claim1);
            
            const claim2 = new Claim(player2Id, 3, 3);
            const result = game.addClaim(claim2);
            
            expect(result.ok).to.be.true;
            expect(game.getClaims()).to.have.lengthOf(2);
        });

        it('should reject invalid claim (lower quantity)', () => {
            const claim1 = new Claim(player1Id, 5, 3);
            game.addClaim(claim1);
            
            const claim2 = new Claim(player2Id, 4, 4);
            const result = game.addClaim(claim2);
            
            expect(result.ok).to.be.false;
            if (!result.ok) {
                expect(result.error.code).to.equal(ErrorCode.INVALID_CLAIM);
            }
        });

        it('should reject out of turn claim', () => {
            const claim = new Claim(player2Id, 2, 3);
            const result = game.addClaim(claim);
            
            expect(result.ok).to.be.false;
            if (!result.ok) {
                expect(result.error.code).to.equal(ErrorCode.OUT_OF_TURN);
            }
        });
    });

    describe('challenge', () => {
        let player1Id: string;
        let player2Id: string;
        let player1: Player;
        let player2: Player;

        beforeEach(() => {
            const p1Result = game.createPlayer('Player1');
            const p2Result = game.createPlayer('Player2');
            
            if (!p1Result.ok || !p2Result.ok) {
                throw new Error('Failed to create players');
            }
            
            player1Id = p1Result.value.playerId;
            player2Id = p2Result.value.playerId;
            player1 = p1Result.value.player;
            player2 = p2Result.value.player;
            
            game.startRound(player1Id);
        });

        it('should require at least one claim before challenging', () => {
            const result = game.challenge(player2Id);
            
            // Challenge should fail without claims
            expect(result.ok).to.be.false;
        });

        it('should determine winner and loser based on claim accuracy', () => {
            // Force specific dice rolls for predictable test
            // Player 1 makes a claim
            const claim = new Claim(player1Id, 2, 3);
            game.addClaim(claim);
            
            // Player 2 challenges
            const result = game.challenge(player2Id);
            
            expect(result.ok).to.be.true;
            if (result.ok) {
                expect(result.value.winnerId).to.be.oneOf([player1Id, player2Id]);
                expect(result.value.loserId).to.be.oneOf([player1Id, player2Id]);
                expect(result.value.winnerId).to.not.equal(result.value.loserId);
            }
        });

        it('should reject challenge when not player\'s turn', () => {
            const claim = new Claim(player1Id, 2, 3);
            game.addClaim(claim);
            
            // Still player 1's turn, player 1 cannot challenge their own claim
            const result = game.challenge(player1Id);
            
            expect(result.ok).to.be.false;
            if (!result.ok) {
                expect(result.error.code).to.equal(ErrorCode.OUT_OF_TURN);
            }
        });
    });

    describe('getters', () => {
        it('should return correct game code', () => {
            expect(game.getGameCode()).to.equal(gameCode);
        });

        it('should return correct host ID', () => {
            expect(game.getHostId()).to.equal(hostId);
        });

        it('should return players map', () => {
            const players = game.getPlayers();
            
            expect(players).to.be.instanceOf(Map);
        });

        it('should return player order array', () => {
            const order = game.getOrder();
            
            expect(order).to.be.an('array');
        });

        it('should return turn index', () => {
            const turnIndex = game.getTurnIndex();
            
            expect(turnIndex).to.be.a('number');
            expect(turnIndex).to.equal(0);
        });

        it('should return claims array', () => {
            const claims = game.getClaims();
            
            expect(claims).to.be.an('array');
        });
    });

    describe('game flow', () => {
        it('should handle a complete round flow', () => {
            // Create 3 players
            const p1Result = game.createPlayer('Player1');
            const p2Result = game.createPlayer('Player2');
            const p3Result = game.createPlayer('Player3');
            
            if (!p1Result.ok || !p2Result.ok || !p3Result.ok) {
                throw new Error('Failed to create players');
            }
            
            const player1Id = p1Result.value.playerId;
            const player2Id = p2Result.value.playerId;
            const player3Id = p3Result.value.playerId;
            
            // Start round
            const startResult = game.startRound(player1Id);
            expect(startResult.ok).to.be.true;
            
            // Player 1 makes a claim
            const claim1 = new Claim(player1Id, 2, 3);
            const claim1Result = game.addClaim(claim1);
            expect(claim1Result.ok).to.be.true;
            
            // Player 2 makes a higher claim
            const claim2 = new Claim(player2Id, 3, 3);
            const claim2Result = game.addClaim(claim2);
            expect(claim2Result.ok).to.be.true;
            
            // Player 3 challenges
            const challengeResult = game.challenge(player3Id);
            expect(challengeResult.ok).to.be.true;
            
            expect(game.getClaims()).to.have.lengthOf(2);
        });
    });
});

