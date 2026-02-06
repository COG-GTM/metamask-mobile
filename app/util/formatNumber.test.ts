import formatNumber from './formatNumber';

describe('formatNumber', () => {
  it('formats integer numbers with thousand separators', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1000000)).toBe('1,000,000');
    expect(formatNumber(1234567890)).toBe('1,234,567,890');
  });

  it('formats decimal numbers', () => {
    expect(formatNumber(1234.56)).toBe('1,234.56');
    expect(formatNumber(1000.123)).toBe('1,000.123');
  });

  it('formats string numbers', () => {
    expect(formatNumber('1000')).toBe('1,000');
    expect(formatNumber('1234567.89')).toBe('1,234,567.89');
  });

  it('handles small numbers', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(1)).toBe('1');
    expect(formatNumber(99)).toBe('99');
  });

  it('handles negative numbers', () => {
    expect(formatNumber(-1000)).toBe('-1,000');
    expect(formatNumber(-1234.56)).toBe('-1,234.56');
  });

  it('handles very large numbers', () => {
    expect(formatNumber('999999999999999')).toBe('999,999,999,999,999');
  });

  it('handles decimal strings', () => {
    expect(formatNumber('0.123456789')).toBe('0.123456789');
  });
});
