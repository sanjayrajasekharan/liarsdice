import { expect } from 'chai';
import { Game } from '../Game.js';
import { Player } from '../Player.js';
import { Claim } from '../Claim.js';
import { ErrorCode } from 'shared/errors.js';
import { GameStage, GameCode, PlayerId } from 'shared/domain.js';

describe('Game', () => {
    let game: Game;
    let gameCode: GameCode;
    let hostName: string;

    beforeEach(() => {
        hostName = 'Host';
        gameCode = Game.generateGameCode();
        game = Game.createGame(gameCode, hostName);
    });

    describe('createPlayer', () => {
        it('should create a player and add to game', () => {
            const result = game.createPlayer('Player1');
            
            expect(result.isOk()).to.be.true;
            if (result.isOk()) {
                expect(result.value.playerId).to.be.a('string');
                expect(result.value.player).to.be.instanceOf(Player);
                expect(result.value.player.getName()).to.equal('Player1');
            }
        });

        it('should add player to the players array', () => {
            const result = game.createPlayer('Player1');
            
            if (result.isOk()) {
                const players = game.getPlayers();
                const playerIds = players.map(p => p.getId());
                expect(playerIds).to.include(result.value.playerId);
            }
        });

        it('should allow up to 6 players including host', () => {
            for (let i = 2; i <= 6; i++) {
                const result = game.createPlayer(`Player${i}`);
                expect(result.isOk()).to.be.true;
            }
            
            expect(game.getPlayers().length).to.equal(6);
        });

        it('should reject 7th player', () => {
            for (let i = 2; i <= 6; i++) {
                game.createPlayer(`Player${i}`);
            }
            
            const result = game.createPlayer('Player7');
            
            expect(result.isErr()).to.be.true;
            if (result.isErr()) {
                expect(result.error).to.equal(ErrorCode.GAME_FULL);
            }
        });

        it('should reject player creation when game is in progress', () => {
            const player1Result = game.createPlayer('Player1');
            const player2Result = game.createPlayer('Player2');
            
            if (player1Result.isOk()) {
                game.startRound(player1Result.value.playerId);
                
                const result = game.createPlayer('Player3');
                expect(result.isErr()).to.be.true;
                if (result.isErr()) {
                    expect(result.error).to.equal(ErrorCode.GAME_IN_PROGRESS);
                }
            }
        });
    });

    describe('startGame', () => {
        it('should start a game successfully', () => {
            const playerResult = game.createPlayer('Player1');
            if (playerResult.isErr()) throw new Error('Failed to create player');
            
            const result = game.startGame(game.getHostId());
            
            expect(result.isOk()).to.be.true;
        });

        it('should transition from PRE_GAME to ROUND_ROBIN stage', () => {
            const player1Result = game.createPlayer('Player1');
            if (player1Result.isErr()) throw new Error('Failed to create player');
            
            game.startGame(game.getHostId());
            
            const players = game.getPlayers();
            const currentPlayerId = players[game.getCurrentTurnIndex()].getId() as PlayerId;
            const validateResult = game.validateTurn(currentPlayerId);
            expect(validateResult.isOk()).to.be.true;
        });

        it('should clear previous claims when starting', () => {
            const player1Result = game.createPlayer('Player1');
            if (player1Result.isErr()) throw new Error('Failed to create player');
            
            game.startGame(game.getHostId());
            
            expect(game.getClaims()).to.be.an('array').that.is.empty;
        });

        it('should only allow host to start the game', () => {
            const playerResult = game.createPlayer('Player1');
            if (playerResult.isErr()) throw new Error('Failed to create player');
            
            const result = game.startGame(playerResult.value.playerId);
            
            expect(result.isErr()).to.be.true;
            if (result.isErr()) {
                expect(result.error).to.equal(ErrorCode.UNAUTHORIZED);
            }
        });

        it('should reject starting game during ROUND_ROBIN stage', () => {
            const player1Result = game.createPlayer('Player1');
            if (player1Result.isErr()) throw new Error('Failed to create player');
            
            game.startGame(game.getHostId());
            const result = game.startGame(game.getHostId());
            
            expect(result.isErr()).to.be.true;
            if (result.isErr()) {
                expect(result.error).to.equal(ErrorCode.GAME_IN_PROGRESS);
            }
        });
    });

    describe('validateTurn', () => {
        let player1Id: PlayerId;
        let player2Id: PlayerId;

        beforeEach(() => {
            const p1Result = game.createPlayer('Player1');
            const p2Result = game.createPlayer('Player2');
            
            if (p1Result.isErr() || p2Result.isErr()) {
                throw new Error('Failed to create players');
            }
            
            player1Id = p1Result.value.playerId;
            player2Id = p2Result.value.playerId;
            
            game.startGame(game.getHostId());
        });

        it('should validate correct turn', () => {
            const players = game.getPlayers();
            const currentPlayerId = players[game.getCurrentTurnIndex()].getId();
            const result = game.validateTurn(currentPlayerId);
            
            expect(result.isOk()).to.be.true;
        });

        it('should reject out of turn action', () => {
            const players = game.getPlayers();
            const currentPlayerId = players[game.getCurrentTurnIndex()].getId();
            const otherPlayerId = (currentPlayerId === player1Id) ? player2Id : player1Id;
            const result = game.validateTurn(otherPlayerId);
            
            expect(result.isErr()).to.be.true;
            if (result.isErr()) {
                expect(result.error).to.equal(ErrorCode.OUT_OF_TURN);
            }
        });

        it('should reject turn validation when round is not active', () => {
            const newGame = Game.createGame(Game.generateGameCode(), 'NewHost');
            const playerResult = newGame.createPlayer('Player1');
            if (playerResult.isErr()) throw new Error('Failed to create player');
            
            const result = newGame.validateTurn(playerResult.value.playerId);
            
            expect(result.isErr()).to.be.true;
            if (result.isErr()) {
                expect(result.error).to.equal(ErrorCode.ROUND_NOT_ACTIVE);
            }
        });
    });

    describe('addClaim', () => {
        let player1Id: PlayerId;
        let player2Id: PlayerId;

        beforeEach(() => {
            const p1Result = game.createPlayer('Player1');
            const p2Result = game.createPlayer('Player2');
            
            if (p1Result.isErr() || p2Result.isErr()) {
                throw new Error('Failed to create players');
            }
            
            player1Id = p1Result.value.playerId;
            player2Id = p2Result.value.playerId;
            
            game.startGame(game.getHostId());
        });

        it('should add a valid first claim and advance turn', () => {
            const players = game.getPlayers();
            const currentPlayerId = players[game.getCurrentTurnIndex()].getId();
            const claim = new Claim(currentPlayerId, 2, 3);
            const initialTurnIndex = game.getCurrentTurnIndex();
            
            const result = game.addClaim(claim);
            
            expect(result.isOk()).to.be.true;
            expect(game.getClaims()).to.have.lengthOf(1);
            expect(game.getCurrentTurnIndex()).to.not.equal(initialTurnIndex);
        });

        it('should add a valid increasing claim and continue turn rotation', () => {
            const players = game.getPlayers();
            const player1 = players[game.getCurrentTurnIndex()].getId();
            const claim1 = new Claim(player1, 2, 3);
            game.addClaim(claim1);
            
            const player2 = players[game.getCurrentTurnIndex()].getId();
            const claim2 = new Claim(player2, 3, 3);
            const result = game.addClaim(claim2);
            
            expect(result.isOk()).to.be.true;
            expect(game.getClaims()).to.have.lengthOf(2);
        });

        it('should reject invalid claim (lower quantity)', () => {
            const players = game.getPlayers();
            const player1 = players[game.getCurrentTurnIndex()].getId();
            const claim1 = new Claim(player1, 5, 3);
            game.addClaim(claim1);
            
            const player2 = players[game.getCurrentTurnIndex()].getId();
            const claim2 = new Claim(player2, 4, 4);
            const result = game.addClaim(claim2);
            
            expect(result.isErr()).to.be.true;
            if (result.isErr()) {
                expect(result.error).to.equal(ErrorCode.INVALID_CLAIM);
            }
        });

        it('should reject out of turn claim', () => {
            const players = game.getPlayers();
            const currentPlayer = players[game.getCurrentTurnIndex()].getId();
            const otherPlayer = players.find(p => p.getId() !== currentPlayer)!.getId();
            
            const claim = new Claim(otherPlayer, 2, 3);
            const result = game.addClaim(claim);
            
            expect(result.isErr()).to.be.true;
            if (result.isErr()) {
                expect(result.error).to.equal(ErrorCode.OUT_OF_TURN);
            }
        });
    });

    describe('challenge', () => {
        let player1Id: PlayerId;
        let player2Id: PlayerId;
        let player1: Player;
        let player2: Player;

        beforeEach(() => {
            const p1Result = game.createPlayer('Player1');
            const p2Result = game.createPlayer('Player2');
            
            if (p1Result.isErr() || p2Result.isErr()) {
                throw new Error('Failed to create players');
            }
            
            player1Id = p1Result.value.playerId;
            player2Id = p2Result.value.playerId;
            player1 = p1Result.value.player;
            player2 = p2Result.value.player;
            
            game.startGame(game.getHostId());
        });

        it('should handle challenge and determine winner/loser', () => {
            const players = game.getPlayers();
            const claimingPlayer = players[game.getCurrentTurnIndex()].getId();
            const claim = new Claim(claimingPlayer, 2, 3);
            game.addClaim(claim);
            
            const challengingPlayer = players[game.getCurrentTurnIndex()].getId();
            const result = game.challenge(challengingPlayer);
            
            expect(result.isOk()).to.be.true;
            if (result.isOk()) {
                expect(result.value).to.have.property('winnerId');
                expect(result.value).to.have.property('loserId');
            }
        });

        it('should determine winner and loser based on claim accuracy', () => {
            const players = game.getPlayers();
            const claimingPlayer = players[game.getCurrentTurnIndex()].getId();
            const claim = new Claim(claimingPlayer, 2, 3);
            game.addClaim(claim);
            
            const challengingPlayer = players[game.getCurrentTurnIndex()].getId();
            const result = game.challenge(challengingPlayer);
            
            expect(result.isOk()).to.be.true;
            if (result.isOk()) {
                expect(result.value.winnerId).to.be.oneOf([claimingPlayer, challengingPlayer]);
                expect(result.value.loserId).to.be.oneOf([claimingPlayer, challengingPlayer]);
                expect(result.value.winnerId).to.not.equal(result.value.loserId);
                expect(result.value.loserOut).to.be.a('boolean');
            }
        });

        it('should reject challenge when not player\'s turn', () => {
            const players = game.getPlayers();
            const claimingPlayer = players[game.getCurrentTurnIndex()].getId();
            const claim = new Claim(claimingPlayer, 2, 3);
            game.addClaim(claim);
            
            const wrongPlayer = players.find((p, idx) => idx !== game.getCurrentTurnIndex())!.getId();
            const result = game.challenge(wrongPlayer);
            
            expect(result.isErr()).to.be.true;
            if (result.isErr()) {
                expect(result.error).to.equal(ErrorCode.OUT_OF_TURN);
            }
        });

        it('should set turn to winner after challenge', () => {
            const players = game.getPlayers();
            const claimingPlayer = players[game.getCurrentTurnIndex()].getId();
            const claim = new Claim(claimingPlayer, 2, 3);
            game.addClaim(claim);
            
            const challengingPlayer = players[game.getCurrentTurnIndex()].getId();
            const result = game.challenge(challengingPlayer);
            
            expect(result.isOk()).to.be.true;
            if (result.isOk()) {
                const currentPlayers = game.getPlayers();
                const currentPlayer = currentPlayers[game.getCurrentTurnIndex()].getId();
                expect(currentPlayer).to.equal(result.value.winnerId);
            }
        });
    });

    describe('game flow', () => {
        it('should handle a complete round flow with stage transitions', () => {
            const p1Result = game.createPlayer('Player1');
            const p2Result = game.createPlayer('Player2');
            
            if (p1Result.isErr() || p2Result.isErr()) {
                throw new Error('Failed to create players');
            }
            
            const startResult = game.startGame(game.getHostId());
            expect(startResult.isOk()).to.be.true;
            
            const players = game.getPlayers();
            const firstPlayer = players[game.getCurrentTurnIndex()].getId();
            const claim1 = new Claim(firstPlayer, 2, 3);
            const claim1Result = game.addClaim(claim1);
            expect(claim1Result.isOk()).to.be.true;
            
            const secondPlayer = players[game.getCurrentTurnIndex()].getId();
            const claim2 = new Claim(secondPlayer, 3, 3);
            const claim2Result = game.addClaim(claim2);
            expect(claim2Result.isOk()).to.be.true;
            
            const thirdPlayer = players[game.getCurrentTurnIndex()].getId();
            const challengeResult = game.challenge(thirdPlayer);
            expect(challengeResult.isOk()).to.be.true;
            
            expect(game.getClaims()).to.have.lengthOf(2);
            
            if (challengeResult.isOk()) {
                expect(challengeResult.value).to.have.property('winnerId');
                expect(challengeResult.value).to.have.property('loserId');
                expect(challengeResult.value).to.have.property('loserOut');
            }
        });
        
        it('should handle turn rotation correctly through multiple claims', () => {
            game.createPlayer('Player1');
            game.createPlayer('Player2');
            
            game.startGame(game.getHostId());
            
            const players = game.getPlayers();
            const initialPlayer = players[game.getCurrentTurnIndex()].getId();
            const claim1 = new Claim(initialPlayer, 2, 3);
            game.addClaim(claim1);
            
            const secondPlayer = players[game.getCurrentTurnIndex()].getId();
            expect(secondPlayer).to.not.equal(initialPlayer);
            
            const claim2 = new Claim(secondPlayer, 3, 3);
            game.addClaim(claim2);
            
            const thirdPlayer = players[game.getCurrentTurnIndex()].getId();
            expect(thirdPlayer).to.not.equal(secondPlayer);
        });
    });
});
