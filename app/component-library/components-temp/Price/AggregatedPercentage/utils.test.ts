import {
  getFormattedAmountChange,
  getFormattedPercentageChange,
  getFormattedValuePrice,
  getPercentageTextColor,
} from './utils';
import { TextColor } from '../../../components/Texts/Text';

describe('AggregatedPercentage utils', () => {
  describe('getFormattedAmountChange', () => {
    it('prepends a + for non-negative values', () => {
      const formatted = getFormattedAmountChange(1.23, 'usd');
      expect(formatted.startsWith('+')).toBe(true);
    });

    it('does not prepend a + for negative values (renderFiat handles the sign)', () => {
      const formatted = getFormattedAmountChange(-1.23, 'usd');
      expect(formatted.startsWith('+')).toBe(false);
    });
  });

  describe('getPercentageTextColor', () => {
    it('returns Alternative when privacy mode is enabled', () => {
      expect(getPercentageTextColor(true, 10)).toBe(TextColor.Alternative);
      expect(getPercentageTextColor(true, -10)).toBe(TextColor.Alternative);
      expect(getPercentageTextColor(true, 0)).toBe(TextColor.Alternative);
    });

    it('returns Default when the change is zero', () => {
      expect(getPercentageTextColor(false, 0)).toBe(TextColor.Default);
    });

    it('returns Success for positive change and Error for negative change', () => {
      expect(getPercentageTextColor(false, 5)).toBe(TextColor.Success);
      expect(getPercentageTextColor(false, -5)).toBe(TextColor.Error);
    });
  });

  describe('getFormattedPercentageChange', () => {
    it('wraps the percentage in parentheses with a + sign for positive values', () => {
      const formatted = getFormattedPercentageChange(5, 'en-US');
      expect(formatted.startsWith('(+')).toBe(true);
      expect(formatted.endsWith(')')).toBe(true);
    });

    it('wraps the percentage in parentheses with a - sign for negative values', () => {
      const formatted = getFormattedPercentageChange(-5, 'en-US');
      expect(formatted.startsWith('(-')).toBe(true);
      expect(formatted.endsWith(')')).toBe(true);
    });
  });

  describe('getFormattedValuePrice', () => {
    it('prepends a + for non-negative amounts', () => {
      const formatted = getFormattedValuePrice(1.23, 'USD');
      expect(formatted.startsWith('+')).toBe(true);
    });

    it('prepends a - for negative amounts', () => {
      const formatted = getFormattedValuePrice(-1.23, 'USD');
      expect(formatted.startsWith('-')).toBe(true);
    });
  });
});
