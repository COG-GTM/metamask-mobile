import formatNumber from './formatNumber';

describe('formatNumber', () => {
  it('should format a number', () => {
    const result = formatNumber(1000);
    expect(result).toBe('1,000');
  });

  it('should format a string number', () => {
    const result = formatNumber('1000000');
    expect(result).toBe('1,000,000');
  });

  it('should format decimal numbers', () => {
    const result = formatNumber(1234.56);
    expect(result).toBe('1,234.56');
  });

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});
