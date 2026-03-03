import { expect } from 'chai';
import { generatePlayerToken, verifyPlayerToken, TokenPayload } from '../src/auth/utils.js';

describe('Auth Utils', () => {
  const testPlayerId = 'player-123';
  const testPlayerName = 'TestPlayer';
  const testGameCode = 'GAME01';

  describe('generatePlayerToken', () => {
    it('should generate a non-empty token string', () => {
      const token = generatePlayerToken(testPlayerId, testPlayerName, testGameCode);

      expect(token).to.be.a('string');
      expect(token.length).to.be.greaterThan(0);
    });

    it('should generate different tokens for different players', () => {
      const token1 = generatePlayerToken('player-1', testPlayerName, testGameCode);
      const token2 = generatePlayerToken('player-2', testPlayerName, testGameCode);

      expect(token1).to.not.equal(token2);
    });

    it('should generate different tokens for different games', () => {
      const token1 = generatePlayerToken(testPlayerId, testPlayerName, 'GAME01');
      const token2 = generatePlayerToken(testPlayerId, testPlayerName, 'GAME02');

      expect(token1).to.not.equal(token2);
    });
  });

  describe('verifyPlayerToken', () => {
    it('should verify a valid token and return payload', () => {
      const token = generatePlayerToken(testPlayerId, testPlayerName, testGameCode);

      const payload = verifyPlayerToken(token);

      expect(payload).to.not.be.null;
      expect(payload!.playerId).to.equal(testPlayerId);
      expect(payload!.playerName).to.equal(testPlayerName);
      expect(payload!.gameCode).to.equal(testGameCode);
    });

    it('should return null for invalid token', () => {
      const payload = verifyPlayerToken('invalid-token');

      expect(payload).to.be.null;
    });

    it('should return null for malformed token', () => {
      const payload = verifyPlayerToken('abc.def.ghi');

      expect(payload).to.be.null;
    });

    it('should return null for empty token', () => {
      const payload = verifyPlayerToken('');

      expect(payload).to.be.null;
    });

    it('should return null for tampered token', () => {
      const token = generatePlayerToken(testPlayerId, testPlayerName, testGameCode);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      const payload = verifyPlayerToken(tamperedToken);

      expect(payload).to.be.null;
    });
  });

  describe('token round-trip', () => {
    it('should preserve all payload fields through encode/decode', () => {
      const playerId = 'uuid-style-player-id-12345';
      const playerName = 'Player With Spaces';
      const gameCode = 'ABCD12';

      const token = generatePlayerToken(playerId, playerName, gameCode);
      const payload = verifyPlayerToken(token);

      expect(payload).to.not.be.null;
      expect(payload!.playerId).to.equal(playerId);
      expect(payload!.playerName).to.equal(playerName);
      expect(payload!.gameCode).to.equal(gameCode);
    });

    it('should handle special characters in player name', () => {
      const playerName = "Player's 名前 <test>";

      const token = generatePlayerToken(testPlayerId, playerName, testGameCode);
      const payload = verifyPlayerToken(token);

      expect(payload).to.not.be.null;
      expect(payload!.playerName).to.equal(playerName);
    });
  });
});
