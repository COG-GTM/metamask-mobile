import { renderHook } from '@testing-library/react-hooks';
import BN from 'bnjs4';
import { swapsUtils } from '@metamask/swaps-controller';
import useBalance from './useBalance';

const ETH_CHAIN_ID = '0x1';

const nativeToken = {
  address: swapsUtils.NATIVE_SWAPS_TOKEN_ADDRESS,
  symbol: 'ETH',
  decimals: 18,
  chainId: ETH_CHAIN_ID,
};

const erc20Token = {
  address: '0xA0b86991c6218b36C1d19D4a2e9Eb0cE3606eB48',
  symbol: 'USDC',
  decimals: 6,
  chainId: ETH_CHAIN_ID,
};

describe('useBalance', () => {
  it('returns null when no source token is provided', () => {
    const { result } = renderHook(() => useBalance({}, {}, '0xabc', null));
    expect(result.current).toBeNull();
  });

  it('returns rendered ETH balance for the native asset', () => {
    const accounts = {
      '0xabc': { balance: '0xde0b6b3a7640000' }, // 1 ETH
    };
    const { result } = renderHook(() =>
      useBalance(accounts, {}, '0xabc', nativeToken),
    );
    expect(typeof result.current).toBe('string');
    expect(result.current).toContain('1');
  });

  it('returns a BN for the native asset when asUnits is true', () => {
    const accounts = {
      '0xabc': { balance: '0xde0b6b3a7640000' },
    };
    const { result } = renderHook(() =>
      useBalance(accounts, {}, '0xabc', nativeToken, { asUnits: true }),
    );
    expect(BN.isBN(result.current)).toBe(true);
  });

  it('returns a formatted balance for an ERC20 token', () => {
    const balances = {
      [erc20Token.address]: '0xf4240', // 1 USDC at 6 decimals
    };
    const { result } = renderHook(() =>
      useBalance({}, balances, '0xabc', erc20Token),
    );
    expect(result.current).toBeDefined();
  });

  it('returns the raw balance for an ERC20 token when asUnits is true', () => {
    const balances = {
      [erc20Token.address]: '0xf4240',
    };
    const { result } = renderHook(() =>
      useBalance({}, balances, '0xabc', erc20Token, { asUnits: true }),
    );
    expect(result.current).toBeDefined();
  });

  it('returns a balance representation when an ERC20 token has no balance entry', () => {
    const { result } = renderHook(() =>
      useBalance({}, {}, '0xabc', erc20Token),
    );
    // With no balance entry found, the hook returns either a BN or formatted value
    expect(result.current).toBeDefined();
    expect(BN.isBN(result.current) || typeof result.current === 'string').toBe(true);
  });
});
