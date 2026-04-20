import MAX_TOKEN_ID_LENGTH from './nftDetails.utils';

describe('nftDetails.utils', () => {
  describe('MAX_TOKEN_ID_LENGTH', () => {
    it('exports the max token id length constant', () => {
      expect(MAX_TOKEN_ID_LENGTH).toBe(15);
    });

    it('is a positive number', () => {
      expect(typeof MAX_TOKEN_ID_LENGTH).toBe('number');
      expect(MAX_TOKEN_ID_LENGTH).toBeGreaterThan(0);
    });
  });
});
