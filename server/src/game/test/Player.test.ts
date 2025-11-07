import { expect } from 'chai';
import { Player } from '../Player.js';
import { Game } from '../Game.js';
import { Claim } from '../Claim.js';
import { GameStage } from '../../../../shared/types.js';

const STARTING_DICE_COUNT = 6;

describe('Player', () => {
    let game: Game;
    let player: Player;

    beforeEach(() => {
        // Create a game and player for testing
        const gameCode = Game.generateGameCode();
        game = Game.createGame(gameCode, 'Host');
        
        const playerResult = game.createPlayer('TestPlayer');
        if (!playerResult.ok) throw new Error('Failed to create player');
        player = playerResult.value.player;
    });

    describe('constructor', () => {
        it('should create a player with correct properties', () => {
            const testPlayer = new Player('player1', 'John', game);
            
            expect(testPlayer.getId()).to.equal('player1');
            expect(testPlayer.getName()).to.equal('John');
        });
    });

    describe('rollDice', () => {
        it('should roll numbers between 1 and 6', () => {
            player.rollDice();
            
            let totalCount = 0;
            for (let i = 1; i <= 6; i++) {
                totalCount += player.getDiceCount(i);
            }
            
            expect(totalCount).to.equal(STARTING_DICE_COUNT);
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
            
            expect(count).to.equal(STARTING_DICE_COUNT - 2);
        });
    });

    describe('getters', () => {
        it('should get correct player ID', () => {
            expect(player.getId()).to.be.a('string');
            expect(player.getId()).to.have.length.greaterThan(0);
        });

        it('should get correct player name', () => {
            expect(player.getName()).to.equal('TestPlayer');
        });
    });
});

