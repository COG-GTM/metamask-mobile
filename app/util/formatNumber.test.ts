import formatNumber from './formatNumber';

describe('formatNumber', () => {
  it('formats a simple integer', () => {
    expect(formatNumber(1000)).toBe('1,000');
  });

  it('formats a large number with commas', () => {
    expect(formatNumber(1000000)).toBe('1,000,000');
  });

  it('formats a decimal number', () => {
    const result = formatNumber(1234.56);
    expect(result).toBe('1,234.56');
  });

  it('formats a string number', () => {
    expect(formatNumber('999999')).toBe('999,999');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('formats a negative number', () => {
    expect(formatNumber(-1000)).toBe('-1,000');
  });

  it('formats a very large number', () => {
    const result = formatNumber('1000000000000');
    expect(result).toBe('1,000,000,000,000');
  });
});
