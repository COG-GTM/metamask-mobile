import { renderHook } from '@testing-library/react-hooks';
import { useTokens } from './useTokens';
import { BridgeToken } from '../types';

const mockUseTokensWithBalance = jest.fn();
const mockUseTopTokens = jest.fn();

jest.mock('./useTokensWithBalance', () => ({
  useTokensWithBalance: (args: unknown) => mockUseTokensWithBalance(args),
}));

jest.mock('./useTopTokens', () => ({
  useTopTokens: (args: unknown) => mockUseTopTokens(args),
}));

const tokenA: BridgeToken = {
  address: '0x0000000000000000000000000000000000000001',
  symbol: 'A',
  name: 'Token A',
  decimals: 18,
  chainId: '0x1',
};

const tokenB: BridgeToken = {
  address: '0x0000000000000000000000000000000000000002',
  symbol: 'B',
  name: 'Token B',
  decimals: 18,
  chainId: '0x1',
};

const tokenC: BridgeToken = {
  address: '0x0000000000000000000000000000000000000003',
  symbol: 'C',
  name: 'Token C',
  decimals: 18,
  chainId: '0x1',
};

describe('useTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('merges balance tokens followed by top tokens that are not already in balance list', () => {
    mockUseTokensWithBalance.mockReturnValue([tokenA]);
    mockUseTopTokens.mockReturnValue({ topTokens: [tokenA, tokenB], pending: false });

    const { result } = renderHook(() =>
      useTokens({ topTokensChainId: '0x1', balanceChainIds: ['0x1'] }),
    );

    expect(result.current.tokens).toEqual([tokenA, tokenB]);
    expect(result.current.pending).toBe(false);
  });

  it('propagates the pending flag from useTopTokens', () => {
    mockUseTokensWithBalance.mockReturnValue([]);
    mockUseTopTokens.mockReturnValue({ topTokens: [], pending: true });

    const { result } = renderHook(() =>
      useTokens({ topTokensChainId: '0x1', balanceChainIds: ['0x1'] }),
    );

    expect(result.current.pending).toBe(true);
  });

  it('returns an empty list when no tokens are provided by underlying hooks', () => {
    mockUseTokensWithBalance.mockReturnValue([]);
    mockUseTopTokens.mockReturnValue({ topTokens: undefined, pending: false });

    const { result } = renderHook(() => useTokens({}));

    expect(result.current.tokens).toEqual([]);
  });

  it('excludes tokens listed in tokensToExclude', () => {
    mockUseTokensWithBalance.mockReturnValue([tokenA, tokenB]);
    mockUseTopTokens.mockReturnValue({ topTokens: [tokenC], pending: false });

    const { result } = renderHook(() =>
      useTokens({
        topTokensChainId: '0x1',
        balanceChainIds: ['0x1'],
        tokensToExclude: [{ address: tokenB.address, chainId: tokenB.chainId }],
      }),
    );

    expect(result.current.tokens).toEqual([tokenA, tokenC]);
  });
});
