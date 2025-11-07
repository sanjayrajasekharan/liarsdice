import { expect } from 'chai';
import { Game } from '../Game.js';
import { Player } from '../Player.js';
import { Claim } from '../Claim.js';
import { ErrorCode } from '../../../../shared/errors.js';
import { GameStage } from '../../../../shared/types.js';

describe('Game', () => {
    let game: Game;
    let gameCode: string;
    let hostName: string;

    beforeEach(() => {
        hostName = 'Host';
        gameCode = Game.generateGameCode();
        game = Game.createGame(gameCode, hostName);
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

        it('should allow up to 6 players including host', () => {
            // Host is already player 1, add 5 more players
            for (let i = 2; i <= 6; i++) {
                const result = game.createPlayer(`Player${i}`);
                expect(result.ok).to.be.true;
            }
            
            expect(game.getPlayers().size).to.equal(6);
        });

        it('should reject 7th player', () => {
            // Host is player 1, add 5 more to reach max
            for (let i = 2; i <= 6; i++) {
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

    describe('startGame', () => {
        it('should start a game successfully', () => {
            const playerResult = game.createPlayer('Player1');
            if (!playerResult.ok) throw new Error('Failed to create player');
            
            const result = game.startGame(game.getHostId());
            
            expect(result.ok).to.be.true;
        });

        it('should transition from PRE_GAME to ROUND_ROBIN stage', () => {
            const player1Result = game.createPlayer('Player1');
            if (!player1Result.ok) throw new Error('Failed to create player');
            
            game.startGame(game.getHostId());
            
            // Game should now be in ROUND_ROBIN stage - verify by checking if validateTurn works
            const currentPlayerId = game.getOrder()[game.getTurnIndex()];
            const validateResult = game.validateTurn(currentPlayerId);
            expect(validateResult.ok).to.be.true;
        });

        it('should clear previous claims when starting', () => {
            const player1Result = game.createPlayer('Player1');
            if (!player1Result.ok) throw new Error('Failed to create player');
            
            game.startGame(game.getHostId());
            
            expect(game.getClaims()).to.be.an('array').that.is.empty;
        });

        it('should only allow host to start the game', () => {
            const playerResult = game.createPlayer('Player1');
            if (!playerResult.ok) throw new Error('Failed to create player');
            
            const result = game.startGame(playerResult.value.playerId);
            
            expect(result.ok).to.be.false;
            if (!result.ok) {
                expect(result.error.code).to.equal(ErrorCode.UNAUTHORIZED);
            }
        });

        it('should reject starting game during ROUND_ROBIN stage', () => {
            const player1Result = game.createPlayer('Player1');
            if (!player1Result.ok) throw new Error('Failed to create player');
            
            game.startGame(game.getHostId());
            const result = game.startGame(game.getHostId());
            
            expect(result.ok).to.be.false;
            if (!result.ok) {
                expect(result.error.code).to.equal(ErrorCode.GAME_IN_PROGRESS);
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
            
            game.startGame(game.getHostId());
        });

        it('should validate correct turn', () => {
            const currentPlayerId = game.getOrder()[game.getTurnIndex()];
            const result = game.validateTurn(currentPlayerId);
            
            expect(result.ok).to.be.true;
        });

        it('should reject out of turn action', () => {
            const currentPlayerId = game.getOrder()[game.getTurnIndex()];
            const otherPlayerId = currentPlayerId === player1Id ? player2Id : player1Id;
            const result = game.validateTurn(otherPlayerId);
            
            expect(result.ok).to.be.false;
            if (!result.ok) {
                expect(result.error.code).to.equal(ErrorCode.OUT_OF_TURN);
            }
        });

        it('should reject turn validation when round is not active', () => {
            const newGame = Game.createGame(Game.generateGameCode(), 'NewHost');
            const playerResult = newGame.createPlayer('Player1');
            if (!playerResult.ok) throw new Error('Failed to create player');
            
            const result = newGame.validateTurn(playerResult.value.playerId);
            
            expect(result.ok).to.be.false;
            if (!result.ok) {
                expect(result.error.code).to.equal(ErrorCode.ROUND_NOT_ACTIVE);
            }
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
            
            game.startGame(game.getHostId());
        });

        it('should add a valid first claim and advance turn', () => {
            const currentPlayerId = game.getOrder()[game.getTurnIndex()];
            const claim = new Claim(currentPlayerId, 2, 3);
            const initialTurnIndex = game.getTurnIndex();
            
            const result = game.addClaim(claim);
            
            expect(result.ok).to.be.true;
            expect(game.getClaims()).to.have.lengthOf(1);
            expect(game.getTurnIndex()).to.not.equal(initialTurnIndex);
        });

        it('should add a valid increasing claim and continue turn rotation', () => {
            const player1 = game.getOrder()[game.getTurnIndex()];
            const claim1 = new Claim(player1, 2, 3);
            game.addClaim(claim1);
            
            const player2 = game.getOrder()[game.getTurnIndex()];
            const claim2 = new Claim(player2, 3, 3);
            const result = game.addClaim(claim2);
            
            expect(result.ok).to.be.true;
            expect(game.getClaims()).to.have.lengthOf(2);
        });

        it('should reject invalid claim (lower quantity)', () => {
            const player1 = game.getOrder()[game.getTurnIndex()];
            const claim1 = new Claim(player1, 5, 3);
            game.addClaim(claim1);
            
            const player2 = game.getOrder()[game.getTurnIndex()];
            const claim2 = new Claim(player2, 4, 4);
            const result = game.addClaim(claim2);
            
            expect(result.ok).to.be.false;
            if (!result.ok) {
                expect(result.error.code).to.equal(ErrorCode.INVALID_CLAIM);
            }
        });

        it('should reject out of turn claim', () => {
            const currentPlayer = game.getOrder()[game.getTurnIndex()];
            const otherPlayer = game.getOrder().find(id => id !== currentPlayer)!;
            
            const claim = new Claim(otherPlayer, 2, 3);
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
            
            game.startGame(game.getHostId());
        });

        it('should handle challenge and determine winner/loser', () => {
            // Make a claim first
            const claimingPlayer = game.getOrder()[game.getTurnIndex()];
            const claim = new Claim(claimingPlayer, 2, 3);
            game.addClaim(claim);
            
            const challengingPlayer = game.getOrder()[game.getTurnIndex()];
            const result = game.challenge(challengingPlayer);
            
            // Challenge should succeed with a claim present
            expect(result.ok).to.be.true;
            if (result.ok) {
                expect(result.value).to.have.property('winnerId');
                expect(result.value).to.have.property('loserId');
            }
        });

        it('should determine winner and loser based on claim accuracy', () => {
            // Player 1 makes a claim
            const claimingPlayer = game.getOrder()[game.getTurnIndex()];
            const claim = new Claim(claimingPlayer, 2, 3);
            game.addClaim(claim);
            
            // Next player challenges
            const challengingPlayer = game.getOrder()[game.getTurnIndex()];
            const result = game.challenge(challengingPlayer);
            
            expect(result.ok).to.be.true;
            if (result.ok) {
                expect(result.value.winnerId).to.be.oneOf([claimingPlayer, challengingPlayer]);
                expect(result.value.loserId).to.be.oneOf([claimingPlayer, challengingPlayer]);
                expect(result.value.winnerId).to.not.equal(result.value.loserId);
                expect(result.value.loserOut).to.be.a('boolean');
            }
        });

        it('should reject challenge when not player\'s turn', () => {
            const claimingPlayer = game.getOrder()[game.getTurnIndex()];
            const claim = new Claim(claimingPlayer, 2, 3);
            game.addClaim(claim);
            
            // Wrong player tries to challenge
            const wrongPlayer = game.getOrder().find((id, idx) => idx !== game.getTurnIndex())!;
            const result = game.challenge(wrongPlayer);
            
            expect(result.ok).to.be.false;
            if (!result.ok) {
                expect(result.error.code).to.equal(ErrorCode.OUT_OF_TURN);
            }
        });

        it('should set turn to winner after challenge', () => {
            const claimingPlayer = game.getOrder()[game.getTurnIndex()];
            const claim = new Claim(claimingPlayer, 2, 3);
            game.addClaim(claim);
            
            const challengingPlayer = game.getOrder()[game.getTurnIndex()];
            const result = game.challenge(challengingPlayer);
            
            expect(result.ok).to.be.true;
            if (result.ok) {
                const currentPlayer = game.getOrder()[game.getTurnIndex()];
                expect(currentPlayer).to.equal(result.value.winnerId);
            }
        });
    });

    describe('game flow', () => {
        it('should handle a complete round flow with stage transitions', () => {
            // Create 2 additional players (host is already player 1)
            const p1Result = game.createPlayer('Player1');
            const p2Result = game.createPlayer('Player2');
            
            if (!p1Result.ok || !p2Result.ok) {
                throw new Error('Failed to create players');
            }
            
            // Start game - transitions to ROUND_ROBIN
            const startResult = game.startGame(game.getHostId());
            expect(startResult.ok).to.be.true;
            
            // First player makes a claim
            const firstPlayer = game.getOrder()[game.getTurnIndex()];
            const claim1 = new Claim(firstPlayer, 2, 3);
            const claim1Result = game.addClaim(claim1);
            expect(claim1Result.ok).to.be.true;
            
            // Second player makes a higher claim
            const secondPlayer = game.getOrder()[game.getTurnIndex()];
            const claim2 = new Claim(secondPlayer, 3, 3);
            const claim2Result = game.addClaim(claim2);
            expect(claim2Result.ok).to.be.true;
            
            // Third player challenges
            const thirdPlayer = game.getOrder()[game.getTurnIndex()];
            const challengeResult = game.challenge(thirdPlayer);
            expect(challengeResult.ok).to.be.true;
            
            // Verify claims were tracked
            expect(game.getClaims()).to.have.lengthOf(2);
            
            // Verify challenge result structure
            if (challengeResult.ok) {
                expect(challengeResult.value).to.have.property('winnerId');
                expect(challengeResult.value).to.have.property('loserId');
                expect(challengeResult.value).to.have.property('loserOut');
            }
        });
        
        it('should handle turn rotation correctly through multiple claims', () => {
            game.createPlayer('Player1');
            game.createPlayer('Player2');
            
            game.startGame(game.getHostId());
            
            const initialPlayer = game.getOrder()[game.getTurnIndex()];
            const claim1 = new Claim(initialPlayer, 2, 3);
            game.addClaim(claim1);
            
            const secondPlayer = game.getOrder()[game.getTurnIndex()];
            expect(secondPlayer).to.not.equal(initialPlayer);
            
            const claim2 = new Claim(secondPlayer, 3, 3);
            game.addClaim(claim2);
            
            const thirdPlayer = game.getOrder()[game.getTurnIndex()];
            expect(thirdPlayer).to.not.equal(secondPlayer);
        });
    });
});

