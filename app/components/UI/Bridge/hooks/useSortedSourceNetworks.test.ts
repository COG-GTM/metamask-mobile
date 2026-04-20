/* eslint-disable react/jsx-pascal-case, react/prop-types, @typescript-eslint/no-unused-vars, @typescript-eslint/no-require-imports, import/no-commonjs */
import { renderHook } from '@testing-library/react-hooks';

const mockEnabledSourceChains: { chainId: string; name?: string }[] = [];
const mockHolder = {
  lastSelectedEvmAccount: { address: '0xabc' } as { address: string } | null,
  evmBalances: {} as Record<
    string,
    {
      tokenFiatBalancesCrossChains: {
        chainId: string;
        nativeFiatValue: number;
        tokenFiatBalances: number[];
      }[];
    }
  >,
  solTokens: [] as { tokenFiatAmount?: number }[],
};

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useSelector: jest.fn((selector) => {
      if (selector === 'SELECT_ENABLED') return mockEnabledSourceChains;
      if (selector === 'SELECT_LAST_EVM')
        return mockHolder.lastSelectedEvmAccount;
      return undefined;
    }),
  };
});

jest.mock('../../../../core/redux/slices/bridge', () => ({
  selectEnabledSourceChains: 'SELECT_ENABLED',
}));

jest.mock('../../../../selectors/accountsController', () => ({
  selectLastSelectedEvmAccount: 'SELECT_LAST_EVM',
}));

jest.mock('../../../hooks/useGetFormattedTokensPerChain', () => ({
  useGetFormattedTokensPerChain: jest.fn(() => ({})),
}));

jest.mock('../../../hooks/useGetTotalFiatBalanceCrossChains', () => ({
  useGetTotalFiatBalanceCrossChains: jest.fn(() => mockHolder.evmBalances),
}));

jest.mock('./useTokensWithBalance', () => ({
  useTokensWithBalance: jest.fn(() => mockHolder.solTokens),
}));

jest.mock('@metamask/bridge-controller', () => ({
  isSolanaChainId: (chainId: string) => chainId.startsWith('solana:'),
}));

jest.mock('@metamask/keyring-api', () => ({
  SolScope: { Mainnet: 'solana:mainnet' },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useSortedSourceNetworks } = require('./useSortedSourceNetworks');

describe('useSortedSourceNetworks', () => {
  beforeEach(() => {
    mockEnabledSourceChains.length = 0;
    mockHolder.evmBalances = {};
    mockHolder.solTokens = [];
    mockHolder.lastSelectedEvmAccount = { address: '0xabc' };
  });

  it('returns an empty list when no source chains are enabled', () => {
    const { result } = renderHook(() => useSortedSourceNetworks());
    expect(result.current.sortedSourceNetworks).toEqual([]);
  });

  it('sorts chains by total fiat value descending', () => {
    mockEnabledSourceChains.push(
      { chainId: '0x1', name: 'mainnet' },
      { chainId: '0x2', name: 'poly' },
    );
    mockHolder.evmBalances = {
      '0xabc': {
        tokenFiatBalancesCrossChains: [
          { chainId: '0x1', nativeFiatValue: 10, tokenFiatBalances: [5, 5] },
          { chainId: '0x2', nativeFiatValue: 100, tokenFiatBalances: [50] },
        ],
      },
    };

    const { result } = renderHook(() => useSortedSourceNetworks());
    const chainIds = result.current.sortedSourceNetworks.map(
      (c: { chainId: string }) => c.chainId,
    );
    expect(chainIds).toEqual(['0x2', '0x1']);
    expect(result.current.sortedSourceNetworks[0].totalFiatValue).toBe(150);
    expect(result.current.sortedSourceNetworks[1].totalFiatValue).toBe(20);
  });

  it('uses solana balances for the Solana chain', () => {
    mockEnabledSourceChains.push(
      { chainId: '0x1', name: 'mainnet' },
      { chainId: 'solana:mainnet', name: 'sol' },
    );
    mockHolder.evmBalances = {
      '0xabc': {
        tokenFiatBalancesCrossChains: [
          { chainId: '0x1', nativeFiatValue: 1, tokenFiatBalances: [] },
        ],
      },
    };
    mockHolder.solTokens = [{ tokenFiatAmount: 7 }, { tokenFiatAmount: 3 }];

    const { result } = renderHook(() => useSortedSourceNetworks());
    const sol = result.current.sortedSourceNetworks.find(
      (c: { chainId: string }) => c.chainId === 'solana:mainnet',
    );
    expect(sol?.totalFiatValue).toBe(10);
  });

  it('returns zero fiat value when the user has no EVM address', () => {
    mockHolder.lastSelectedEvmAccount = null;
    mockEnabledSourceChains.push({ chainId: '0x1', name: 'mainnet' });

    const { result } = renderHook(() => useSortedSourceNetworks());
    expect(result.current.sortedSourceNetworks[0].totalFiatValue).toBe(0);
  });
});
