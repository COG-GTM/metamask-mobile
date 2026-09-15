import { getEarnTokenKey } from './getEarnTokenKey';

describe('getEarnTokenKey', () => {
  it('returns the same key for the same symbol and chainId', () => {
    expect(getEarnTokenKey('USDC', '0x1')).toBe(getEarnTokenKey('USDC', '0x1'));
  });

  it('returns different keys when the chainId differs', () => {
    expect(getEarnTokenKey('USDC', '0x1')).not.toBe(
      getEarnTokenKey('USDC', '0x89'),
    );
  });

  it('returns different keys when the symbol differs', () => {
    expect(getEarnTokenKey('USDC', '0x1')).not.toBe(
      getEarnTokenKey('USDT', '0x1'),
    );
  });

  it('does not collide when symbol and chainId are swapped', () => {
    expect(getEarnTokenKey('a', 'b')).not.toBe(getEarnTokenKey('b', 'a'));
  });
});
