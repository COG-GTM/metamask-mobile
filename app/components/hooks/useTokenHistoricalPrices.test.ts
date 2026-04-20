import { renderHook } from '@testing-library/react-hooks';
import useTokenHistoricalPrices, {
  standardizeTimeInterval,
} from './useTokenHistoricalPrices';

const mockUseSelector = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('../../selectors/multichain', () => ({
  selectMultichainHistoricalPrices: jest.fn(),
}));

jest.mock('../../selectors/multichainNetworkController', () => ({
  selectIsEvmNetworkSelected: jest.fn(),
}));

jest.mock('../../core/Engine', () => ({
  __esModule: true,
  default: {
    context: {
      MultichainAssetsRatesController: {
        fetchHistoricalPricesForAsset: jest.fn(),
      },
    },
  },
}));

describe('standardizeTimeInterval', () => {
  it.each([
    ['1d', 'P1D'],
    ['1w', 'P7D'],
    ['7d', 'P7D'],
    ['1m', 'P1M'],
    ['3m', 'P3M'],
    ['1y', 'P1Y'],
    ['3y', 'P3Y'],
  ])('maps %s to %s', (input, expected) => {
    expect(
      standardizeTimeInterval(
        input as Parameters<typeof standardizeTimeInterval>[0],
      ),
    ).toBe(expected);
  });

  it('falls back to P1D for unknown values', () => {
    expect(
      standardizeTimeInterval(
        'unknown' as unknown as Parameters<typeof standardizeTimeInterval>[0],
      ),
    ).toBe('P1D');
  });
});

describe('useTokenHistoricalPrices', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockUseSelector.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches EVM historical prices and sets data', async () => {
    // isEvmSelected -> true (second useSelector call)
    mockUseSelector
      .mockReturnValueOnce({}) // multichainHistoricalPrices
      .mockReturnValueOnce(true); // isEvmSelected

    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        prices: [
          ['1700000000', 100],
          ['1700000600', 101],
        ],
      }),
    }) as unknown as typeof global.fetch;

    const { result, waitForNextUpdate } = renderHook(() =>
      useTokenHistoricalPrices({
        asset: { address: '0xabc' } as Parameters<
          typeof useTokenHistoricalPrices
        >[0]['asset'],
        address: '0xabc',
        chainId: '0x1',
        timePeriod: '1d',
        vsCurrency: 'usd',
      }),
    );

    expect(result.current.isLoading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual([
      ['1700000000', 100],
      ['1700000600', 101],
    ]);
  });

  it('captures errors from the fetch call', async () => {
    mockUseSelector.mockReturnValueOnce({}).mockReturnValueOnce(true);

    const fetchError = new Error('network down');
    global.fetch = jest
      .fn()
      .mockRejectedValue(fetchError) as unknown as typeof global.fetch;

    const { result, waitForNextUpdate } = renderHook(() =>
      useTokenHistoricalPrices({
        asset: { address: '0xabc' } as Parameters<
          typeof useTokenHistoricalPrices
        >[0]['asset'],
        address: '0xabc',
        chainId: '0x1',
        timePeriod: '7d',
        vsCurrency: 'usd',
      }),
    );

    await waitForNextUpdate();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(fetchError);
  });
});
