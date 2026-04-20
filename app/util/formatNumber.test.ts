import formatNumber from './formatNumber';

describe('formatNumber', () => {
  it('formats a small number with default (no) thousands separator', () => {
    expect(formatNumber(123)).toBe('123');
  });

  it('formats a large number with grouping', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('accepts a string input', () => {
    expect(formatNumber('1000000')).toBe('1,000,000');
  });

  it('preserves decimal portions', () => {
    expect(formatNumber('1234.5678')).toBe('1,234.5678');
  });
});
