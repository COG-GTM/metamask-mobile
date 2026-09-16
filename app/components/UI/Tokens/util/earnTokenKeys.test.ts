import { buildEarnTokenKeys, getEarnTokenKey } from './earnTokenKeys';

describe('earnTokenKeys', () => {
  it('builds a key from symbol and chainId', () => {
    expect(getEarnTokenKey('USDC', '0x1')).toBe('USDC-0x1');
    expect(getEarnTokenKey(undefined, undefined)).toBe('undefined-undefined');
  });

  it('matches only tokens with the same symbol and chainId', () => {
    const keys = buildEarnTokenKeys([
      { symbol: 'USDC', chainId: '0x1' },
      { symbol: 'DAI', chainId: '0x2105' },
    ]);

    expect(keys.has(getEarnTokenKey('USDC', '0x1'))).toBe(true);
    expect(keys.has(getEarnTokenKey('DAI', '0x2105'))).toBe(true);
    expect(keys.has(getEarnTokenKey('USDC', '0x2105'))).toBe(false);
    expect(keys.has(getEarnTokenKey('DAI', '0x1'))).toBe(false);
    expect(keys.has(getEarnTokenKey('ETH', '0x1'))).toBe(false);
  });

  it('returns an empty set for no earn tokens', () => {
    expect(buildEarnTokenKeys([]).size).toBe(0);
  });
});
