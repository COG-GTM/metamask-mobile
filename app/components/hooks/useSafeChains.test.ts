import { renderHook } from '@testing-library/react-hooks';
import { useSafeChains, rpcIdentifierUtility, SafeChain } from './useSafeChains';

const mockUseSelector = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('../../selectors/preferencesController', () => ({
  selectUseSafeChainsListValidation: jest.fn(),
}));

describe('rpcIdentifierUtility', () => {
  const safeChains: SafeChain[] = [
    {
      chainId: '1',
      name: 'Ethereum',
      nativeCurrency: { symbol: 'ETH' },
      rpc: ['https://rpc.example.com'],
    },
  ];

  it('returns the matching safeChain and host when rpc matches a known chain', () => {
    const result = rpcIdentifierUtility(
      'https://rpc.example.com/path',
      safeChains,
    );
    expect(result.safeChain).toEqual(safeChains[0]);
    expect(result.safeRPCUrl).toBe('rpc.example.com');
  });

  it('returns an unknown descriptor when no chain matches', () => {
    const result = rpcIdentifierUtility('https://other.example.com', safeChains);
    expect(result.safeChain).toEqual({
      chainId: '',
      nativeCurrency: { symbol: '' },
    });
    expect(result.safeRPCUrl).toBe('Unknown rpcUrl');
  });
});

describe('useSafeChains', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    mockUseSelector.mockReset();
  });

  it('starts with an empty list when validation is disabled', () => {
    mockUseSelector.mockReturnValue(false);
    const { result } = renderHook(() => useSafeChains());
    expect(result.current).toEqual({ safeChains: [] });
  });

  it('fetches chains when validation is enabled', async () => {
    mockUseSelector.mockReturnValue(true);
    const fetchSpy = jest.fn().mockResolvedValue({
      json: async () => [
        {
          chainId: '1',
          name: 'Ethereum',
          nativeCurrency: { symbol: 'ETH' },
          rpc: ['https://rpc.example.com'],
        },
      ],
    });
    global.fetch = fetchSpy as unknown as typeof global.fetch;

    const { result, waitForNextUpdate } = renderHook(() => useSafeChains());
    await waitForNextUpdate();
    expect(fetchSpy).toHaveBeenCalledWith('https://chainid.network/chains.json');
    expect(result.current.safeChains).toEqual([
      {
        chainId: '1',
        name: 'Ethereum',
        nativeCurrency: { symbol: 'ETH' },
        rpc: ['https://rpc.example.com'],
      },
    ]);
  });

  it('captures errors from the fetch call', async () => {
    mockUseSelector.mockReturnValue(true);
    const fetchError = new Error('network');
    global.fetch = jest
      .fn()
      .mockRejectedValue(fetchError) as unknown as typeof global.fetch;

    const { result, waitForNextUpdate } = renderHook(() => useSafeChains());
    await waitForNextUpdate();
    expect(result.current.error).toBe(fetchError);
  });
});
