import { renderHook } from '@testing-library/react-native';
import { Hex } from '@metamask/utils';
import { useTokens } from './useTokens';
import { useTokensWithBalance } from './useTokensWithBalance';
import { useTopTokens } from './useTopTokens';
import { BridgeToken } from '../types';

jest.mock('./useTokensWithBalance', () => ({
  useTokensWithBalance: jest.fn(),
}));
jest.mock('./useTopTokens', () => ({
  useTopTokens: jest.fn(),
}));

const chainId = '0x1' as Hex;
const makeToken = (address: string): BridgeToken => ({
  address,
  symbol: address,
  name: address,
  decimals: 18,
  chainId,
});

const balanceTokens = [makeToken('0xa'), makeToken('0xb')];
const topTokens = [makeToken('0xb'), makeToken('0xc'), makeToken('0xd')];

describe('useTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTokensWithBalance as jest.Mock).mockReturnValue(balanceTokens);
    (useTopTokens as jest.Mock).mockReturnValue({ topTokens, pending: false });
  });

  it('merges balance and top tokens and drops excluded tokens', () => {
    const { result } = renderHook(() =>
      useTokens({
        topTokensChainId: chainId,
        balanceChainIds: [chainId],
        tokensToExclude: [{ address: '0xc', chainId }],
      }),
    );

    expect(result.current.tokens.map((t) => t.address)).toEqual([
      '0xa',
      '0xb',
      '0xd',
    ]);
  });

  it('keeps the tokens reference stable across renders with inline tokensToExclude', () => {
    const { result, rerender } = renderHook(
      ({ excludedAddress }: { excludedAddress: string }) =>
        useTokens({
          topTokensChainId: chainId,
          balanceChainIds: [chainId],
          tokensToExclude: [{ address: excludedAddress, chainId }],
        }),
      { initialProps: { excludedAddress: '0xc' } },
    );

    const first = result.current.tokens;
    rerender({ excludedAddress: '0xc' });
    rerender({ excludedAddress: '0xc' });
    expect(result.current.tokens).toBe(first);

    rerender({ excludedAddress: '0xa' });
    expect(result.current.tokens).not.toBe(first);
    expect(result.current.tokens.map((t) => t.address)).toEqual([
      '0xb',
      '0xc',
      '0xd',
    ]);
  });
});
