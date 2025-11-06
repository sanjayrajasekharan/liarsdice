import { expect } from 'chai';
import { Claim } from '../Claim.js';

describe('Claim', () => {
    describe('constructor', () => {
        it('should create a claim with correct properties', () => {
            const claim = new Claim('player1', 5, 4);
            
            expect(claim.getPlayerId()).to.equal('player1');
            expect(claim.getQuantity()).to.equal(5);
            expect(claim.getFaceValue()).to.equal(4);
        });
    });

    describe('validateAgainst', () => {
        it('should accept a claim with higher quantity', () => {
            const oldClaim = new Claim('player1', 5, 4);
            const newClaim = new Claim('player2', 6, 3);
            
            expect(newClaim.validateAgainst(oldClaim)).to.be.true;
        });

        it('should accept a claim with same quantity but higher face value', () => {
            const oldClaim = new Claim('player1', 5, 4);
            const newClaim = new Claim('player2', 5, 5);
            
            expect(newClaim.validateAgainst(oldClaim)).to.be.true;
        });

        it('should reject a claim with lower quantity', () => {
            const oldClaim = new Claim('player1', 5, 4);
            const newClaim = new Claim('player2', 4, 6);
            
            expect(newClaim.validateAgainst(oldClaim)).to.be.false;
        });

        it('should reject a claim with same quantity but lower face value', () => {
            const oldClaim = new Claim('player1', 5, 4);
            const newClaim = new Claim('player2', 5, 3);
            
            expect(newClaim.validateAgainst(oldClaim)).to.be.false;
        });

        it('should reject a claim with same quantity and same face value', () => {
            const oldClaim = new Claim('player1', 5, 4);
            const newClaim = new Claim('player2', 5, 4);
            
            expect(newClaim.validateAgainst(oldClaim)).to.be.false;
        });

        it('should accept progressively higher claims', () => {
            const claim1 = new Claim('player1', 2, 3);
            const claim2 = new Claim('player2', 2, 4);
            const claim3 = new Claim('player3', 3, 1);
            
            expect(claim2.validateAgainst(claim1)).to.be.true;
            expect(claim3.validateAgainst(claim2)).to.be.true;
        });
    });

    describe('getters', () => {
        it('should return correct player ID', () => {
            const claim = new Claim('test-player-123', 5, 4);
            expect(claim.getPlayerId()).to.equal('test-player-123');
        });

        it('should return correct quantity', () => {
            const claim = new Claim('player1', 10, 4);
            expect(claim.getQuantity()).to.equal(10);
        });

        it('should return correct face value', () => {
            const claim = new Claim('player1', 5, 6);
            expect(claim.getFaceValue()).to.equal(6);
        });
    });
});
