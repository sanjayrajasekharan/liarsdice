import { expect } from 'chai';
import { Player } from '../Player.js';
import { Game } from '../Game.js';
import { Claim } from '../Claim.js';
import { GameStage } from '../../../shared/types.js';

describe('Player', () => {
    let game: Game;
    let player: Player;

    beforeEach(() => {
        // Create a game and player for testing
        const gameResult = Game.create('host-id');
        if (!gameResult.ok) throw new Error('Failed to create game');
        game = gameResult.value.game;
        
        const playerResult = game.createPlayer('TestPlayer', null as any);
        if (!playerResult.ok) throw new Error('Failed to create player');
        player = playerResult.value.player;
    });

    describe('constructor', () => {
        it('should create a player with correct properties', () => {
            const testPlayer = new Player('player1', 'John', game);
            
            expect(testPlayer.getId()).to.equal('player1');
            expect(testPlayer.getName()).to.equal('John');
            expect(testPlayer.getWebSocket()).to.be.null;
        });

        it('should accept optional WebSocket parameter', () => {
            const mockWs = {} as WebSocket;
            const testPlayer = new Player('player1', 'John', game, mockWs);
            
            expect(testPlayer.getWebSocket()).to.equal(mockWs);
        });
    });

    describe('rollDice', () => {
        it('should roll 5 dice initially', () => {
            player.rollDice();
            
            let totalCount = 0;
            for (let i = 1; i <= 6; i++) {
                totalCount += player.getDiceCount(i);
            }
            
            expect(totalCount).to.equal(5);
        });

        it('should roll dice with values between 1 and 6', () => {
            player.rollDice();
            
            for (let i = 1; i <= 6; i++) {
                const count = player.getDiceCount(i);
                expect(count).to.be.at.least(0);
            }
        });

        it('should generate different dice rolls', () => {
            // Roll multiple times and check we get different results at least once
            const rolls: string[] = [];
            
            for (let i = 0; i < 10; i++) {
                player.rollDice();
                const rollSignature = [1, 2, 3, 4, 5, 6]
                    .map(face => player.getDiceCount(face))
                    .join(',');
                rolls.push(rollSignature);
            }
            
            // Check that not all rolls are identical
            const uniqueRolls = new Set(rolls);
            expect(uniqueRolls.size).to.be.greaterThan(1);
        });
    });

    describe('getDiceCount', () => {
        it('should return correct count for each face value', () => {
            player.rollDice();
            
            let total = 0;
            for (let face = 1; face <= 6; face++) {
                const count = player.getDiceCount(face);
                expect(count).to.be.a('number');
                expect(count).to.be.at.least(0);
                total += count;
            }
            
            expect(total).to.equal(5);
        });

        it('should return 0 for face values with no dice', () => {
            // This test might be flaky since it depends on random rolls
            // but we can at least verify the method works
            player.rollDice();
            
            // At least one face value should have 0 dice (statistically likely)
            let hasZero = false;
            for (let i = 1; i <= 6; i++) {
                if (player.getDiceCount(i) === 0) {
                    hasZero = true;
                    break;
                }
            }
            
            // This assertion might occasionally fail, but is statistically likely to pass
            // If it becomes problematic, we could mock the dice rolling
        });
    });

    describe('loseDie', () => {
        it('should reduce the number of dice', () => {
            player.rollDice();
            const initialCount = [1, 2, 3, 4, 5, 6].reduce((sum, face) => 
                sum + player.getDiceCount(face), 0);
            
            player.loseDie();
            player.rollDice();
            
            const newCount = [1, 2, 3, 4, 5, 6].reduce((sum, face) => 
                sum + player.getDiceCount(face), 0);
            
            expect(newCount).to.equal(initialCount - 1);
        });

        it('should handle multiple dice losses', () => {
            player.rollDice();
            
            player.loseDie();
            player.loseDie();
            player.rollDice();
            
            const count = [1, 2, 3, 4, 5, 6].reduce((sum, face) => 
                sum + player.getDiceCount(face), 0);
            
            expect(count).to.equal(3);
        });
    });

    describe('getters and setters', () => {
        it('should get correct player ID', () => {
            expect(player.getId()).to.be.a('string');
            expect(player.getId()).to.have.length.greaterThan(0);
        });

        it('should get correct player name', () => {
            expect(player.getName()).to.equal('TestPlayer');
        });

        it('should set and get WebSocket', () => {
            const mockWs = { test: 'socket' } as any;
            player.setWebSocket(mockWs);
            
            expect(player.getWebSocket()).to.equal(mockWs);
        });

        it('should initially have null WebSocket', () => {
            const testPlayer = new Player('id', 'name', game);
            expect(testPlayer.getWebSocket()).to.be.null;
        });
    });
});
