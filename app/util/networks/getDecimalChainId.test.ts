import getDecimalChainId from './getDecimalChainId';

describe('getDecimalChainId', () => {
  it('converts a 0x-prefixed hex chain id to a decimal string', () => {
    expect(getDecimalChainId('0x1')).toBe('1');
    expect(getDecimalChainId('0x89')).toBe('137');
    expect(getDecimalChainId('0xa4b1')).toBe('42161');
  });

  it('returns input unchanged when it is falsy', () => {
    expect(getDecimalChainId('')).toBe('');
  });

  it('returns input unchanged when not a 0x-prefixed string', () => {
    expect(getDecimalChainId('1')).toBe('1');
    expect(getDecimalChainId('ethereum')).toBe('ethereum');
  });

  it('returns input unchanged when it is not a string', () => {
    expect(getDecimalChainId(1 as unknown as string)).toBe(1);
    expect(getDecimalChainId(undefined as unknown as string)).toBeUndefined();
    expect(getDecimalChainId(null as unknown as string)).toBeNull();
  });
});
