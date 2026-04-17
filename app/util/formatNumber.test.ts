import formatNumber from './formatNumber';

describe('formatNumber', () => {
  it('formats integer', () => {
    expect(formatNumber(1000)).toBe('1,000');
  });

  it('formats large number', () => {
    expect(formatNumber(1000000)).toBe('1,000,000');
  });

  it('formats string number', () => {
    expect(formatNumber('1234567')).toBe('1,234,567');
  });

  it('formats decimal', () => {
    expect(formatNumber(1234.56)).toBe('1,234.56');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('formats small number', () => {
    expect(formatNumber(1)).toBe('1');
  });
});
