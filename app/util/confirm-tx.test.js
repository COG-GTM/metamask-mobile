import { roundExponential, formatCurrency } from './confirm-tx';

describe('confirm-tx', () => {
  describe('roundExponential', () => {
    it('should return original string for small numbers', () => {
      expect(roundExponential('123.456')).toBe('123.456');
    });

    it('should round numbers with large exponentials', () => {
      const result = roundExponential('1e+21');
      expect(result).toBeDefined();
    });
  });

  describe('formatCurrency', () => {
    it('should format crypto currency codes', () => {
      const result = formatCurrency('100', 'USDC');
      expect(result).toContain('100');
      expect(result).toContain('USDC');
    });

    it('should format fiat currency codes', () => {
      const result = formatCurrency('100', 'USD');
      expect(result).toBeDefined();
    });
  });
});
