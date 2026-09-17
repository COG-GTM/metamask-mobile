import formatNumber from './formatNumber';

describe('formatNumber', () => {
  it('adds thousands separators to large integers', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('leaves small numbers unchanged', () => {
    expect(formatNumber(1)).toBe('1');
    expect(formatNumber(0)).toBe('0');
  });

  it('accepts numeric strings', () => {
    expect(formatNumber('1000000')).toBe('1,000,000');
  });

  it('preserves the decimal portion', () => {
    expect(formatNumber(1234.56)).toBe('1,234.56');
    expect(formatNumber('1234.5')).toBe('1,234.5');
  });

  it('handles negative numbers', () => {
    expect(formatNumber(-1000)).toBe('-1,000');
  });
});
