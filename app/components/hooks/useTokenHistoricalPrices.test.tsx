import { CaipAssetId, Hex } from '@metamask/utils';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import Engine from '../../core/Engine';
import { TokenI } from '../UI/Tokens/types';
import useTokenHistoricalPrices, {
  TimePeriod,
} from './useTokenHistoricalPrices';

const CAIP_ASSET_ID =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501' as CaipAssetId;

let mockIsEvmSelected = true;

jest.mock('react-redux', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('../../selectors/multichainNetworkController', () => ({
  ...jest.requireActual('../../selectors/multichainNetworkController'),
  selectIsEvmNetworkSelected: () => mockIsEvmSelected,
}));

jest.mock('../../core/Engine', () => ({
  context: {
    MultichainAssetsRatesController: {
      fetchHistoricalPricesForAsset: jest.fn(),
      state: { historicalPrices: {} },
    },
  },
}));

const controller = Engine.context
  .MultichainAssetsRatesController as unknown as {
  fetchHistoricalPricesForAsset: jest.Mock;
  state: {
    historicalPrices: Record<
      string,
      Record<string, { intervals: Record<string, [string, string][]> }>
    >;
  };
};

const defaultProps = {
  asset: { address: CAIP_ASSET_ID } as TokenI,
  address: '0x0000000000000000000000000000000000000001',
  chainId: '0x1' as Hex,
  timePeriod: '1d' as TimePeriod,
  vsCurrency: 'usd',
};

const mockFetch = jest.fn();
const originalFetch = global.fetch;

describe('useTokenHistoricalPrices', () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsEvmSelected = true;
    controller.state = { historicalPrices: {} };
    controller.fetchHistoricalPricesForAsset.mockResolvedValue(undefined);
    mockFetch.mockResolvedValue({
      json: async () => ({ prices: [['1', 2]] as [string, number][] }),
    });
    global.fetch = mockFetch as unknown as typeof global.fetch;
  });

  it('fetches EVM prices once and not again on unrelated re-renders', async () => {
    const { result, rerender } = renderHook(
      (props: Parameters<typeof useTokenHistoricalPrices>[0]) =>
        useTokenHistoricalPrices(props),
      { initialProps: defaultProps },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([['1', 2]]);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    rerender({ ...defaultProps });
    rerender({ ...defaultProps });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('refetches EVM prices when the time period changes', async () => {
    const { result, rerender } = renderHook(
      (props: Parameters<typeof useTokenHistoricalPrices>[0]) =>
        useTokenHistoricalPrices(props),
      { initialProps: defaultProps },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ ...defaultProps, timePeriod: '1m' });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });

  it('reads non-EVM prices from the controller state after fetching', async () => {
    mockIsEvmSelected = false;
    controller.fetchHistoricalPricesForAsset.mockImplementation(async () => {
      controller.state = {
        historicalPrices: {
          [CAIP_ASSET_ID]: {
            usd: { intervals: { P1D: [['1000', '1.5']] } },
          },
        },
      };
    });

    const { result } = renderHook(
      (props: Parameters<typeof useTokenHistoricalPrices>[0]) =>
        useTokenHistoricalPrices(props),
      { initialProps: defaultProps },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(controller.fetchHistoricalPricesForAsset).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual([['1000', 1.5]]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('ignores a stale non-EVM response that resolves after the period changed', async () => {
    mockIsEvmSelected = false;
    controller.state = {
      historicalPrices: {
        [CAIP_ASSET_ID]: {
          usd: {
            intervals: {
              P1D: [['1000', '1']],
              P1M: [['2000', '2']],
            },
          },
        },
      },
    };

    let resolveFirstFetch: () => void = () => undefined;
    controller.fetchHistoricalPricesForAsset
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveFirstFetch = resolve;
          }),
      )
      .mockResolvedValue(undefined);

    const { result, rerender } = renderHook(
      (props: Parameters<typeof useTokenHistoricalPrices>[0]) =>
        useTokenHistoricalPrices(props),
      { initialProps: defaultProps },
    );

    rerender({ ...defaultProps, timePeriod: '1m' });
    await waitFor(() => expect(result.current.data).toEqual([['2000', 2]]));

    await act(async () => {
      resolveFirstFetch();
    });

    expect(result.current.data).toEqual([['2000', 2]]);
  });
});
