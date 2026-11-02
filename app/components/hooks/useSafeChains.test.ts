import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { useSafeChains } from './useSafeChains';
import {
  SAFE_CHAINS_LIST_URL,
  clearSafeChainsListCache,
} from '../../util/networks/safeChainsList';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('axios');

const mockSafeChains = [
  {
    chainId: 1,
    name: 'Ethereum Mainnet',
    nativeCurrency: { symbol: 'ETH' },
    rpc: ['https://mainnet.infura.io/v3/'],
  },
];

const mockValidationEnabled = (enabled: boolean) => {
  (useSelector as jest.MockedFn<typeof useSelector>).mockImplementation(
    (selector) =>
      selector({
        engine: {
          backgroundState: {
            PreferencesController: { useSafeChainsListValidation: enabled },
          },
        },
      }),
  );
};

describe('useSafeChains', () => {
  const mockedGet = axios.get as jest.MockedFn<typeof axios.get>;

  beforeEach(() => {
    clearSafeChainsListCache();
    mockedGet.mockResolvedValue({ data: mockSafeChains });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('downloads chains.json once and serves later mounts from the cache', async () => {
    mockValidationEnabled(true);

    const first = renderHook(() => useSafeChains());
    await first.waitForNextUpdate();
    expect(first.result.current.safeChains).toEqual(mockSafeChains);
    first.unmount();

    const second = renderHook(() => useSafeChains());
    await second.waitForNextUpdate();
    expect(second.result.current.safeChains).toEqual(mockSafeChains);

    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(mockedGet).toHaveBeenCalledWith(SAFE_CHAINS_LIST_URL);
  });

  it('shares one in-flight request between concurrent mounts', async () => {
    mockValidationEnabled(true);

    const first = renderHook(() => useSafeChains());
    const second = renderHook(() => useSafeChains());
    await first.waitForNextUpdate();

    expect(first.result.current.safeChains).toEqual(mockSafeChains);
    expect(second.result.current.safeChains).toEqual(mockSafeChains);
    expect(mockedGet).toHaveBeenCalledTimes(1);
  });

  it('does not download chains.json when safe chains validation is off', () => {
    mockValidationEnabled(false);

    const { result } = renderHook(() => useSafeChains());

    expect(result.current.safeChains).toEqual([]);
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('returns the error and retries on the next mount when the download fails', async () => {
    mockValidationEnabled(true);
    const error = new Error('network down');
    mockedGet.mockRejectedValueOnce(error);

    const first = renderHook(() => useSafeChains());
    await first.waitForNextUpdate();
    expect(first.result.current.error).toBe(error);
    first.unmount();

    const second = renderHook(() => useSafeChains());
    await second.waitForNextUpdate();
    expect(second.result.current.safeChains).toEqual(mockSafeChains);
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });
});
