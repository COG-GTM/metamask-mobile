import { isPortfolioUrl, isBridgeUrl, isValidASCIIURL, toPunycodeURL } from './index';

describe('url utils', () => {
  describe('isPortfolioUrl', () => {
    it('returns false for non-portfolio URLs', () => {
      expect(isPortfolioUrl('https://google.com')).toBe(false);
    });

    it('returns false for invalid URLs', () => {
      expect(isPortfolioUrl('not-a-url')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isPortfolioUrl('')).toBe(false);
    });
  });

  describe('isBridgeUrl', () => {
    it('returns false for non-bridge URLs', () => {
      expect(isBridgeUrl('https://google.com')).toBe(false);
    });

    it('returns false for invalid URLs', () => {
      expect(isBridgeUrl('not-a-url')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isBridgeUrl('')).toBe(false);
    });
  });

  describe('isValidASCIIURL', () => {
    it('returns true for valid ASCII URLs', () => {
      expect(isValidASCIIURL('https://example.com')).toBe(true);
    });

    it('returns true for URLs with paths', () => {
      expect(isValidASCIIURL('https://example.com/path/to/page')).toBe(true);
    });

    it('returns false for undefined', () => {
      expect(isValidASCIIURL(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidASCIIURL('')).toBe(false);
    });

    it('returns true for URLs with ports', () => {
      expect(isValidASCIIURL('https://example.com:8080')).toBe(true);
    });
  });

  describe('toPunycodeURL', () => {
    it('returns same URL for ASCII URLs', () => {
      expect(toPunycodeURL('https://example.com')).toBe('https://example.com');
    });

    it('returns same URL for ASCII URL with path', () => {
      expect(toPunycodeURL('https://example.com/path')).toBe('https://example.com/path');
    });

    it('returns original string for invalid URLs', () => {
      expect(toPunycodeURL('not-a-url')).toBe('not-a-url');
    });
  });
});
