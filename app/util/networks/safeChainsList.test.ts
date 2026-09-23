import axios from 'axios';
import {
  CHAIN_ID_NETWORK_URL,
  SAFE_CHAINS_LIST_TIMEOUT_MS,
  clearSafeChainsListCache,
  getSafeChainsList,
} from './safeChainsList';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('getSafeChainsList', () => {
  const chains = [{ chainId: 1, name: 'Ethereum Mainnet' }];

  beforeEach(() => {
    jest.clearAllMocks();
    clearSafeChainsListCache();
  });

  it('fetches the chain list with a request timeout', async () => {
    mockedAxios.get.mockResolvedValue({ data: chains });

    await expect(getSafeChainsList()).resolves.toEqual(chains);
    expect(mockedAxios.get).toHaveBeenCalledWith(CHAIN_ID_NETWORK_URL, {
      timeout: SAFE_CHAINS_LIST_TIMEOUT_MS,
    });
  });

  it('reuses the cached response across calls', async () => {
    mockedAxios.get.mockResolvedValue({ data: chains });

    await getSafeChainsList();
    await getSafeChainsList();

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('shares a single in-flight request', async () => {
    mockedAxios.get.mockResolvedValue({ data: chains });

    const [first, second] = await Promise.all([
      getSafeChainsList(),
      getSafeChainsList(),
    ]);

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it('does not cache failures', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('network error'));
    mockedAxios.get.mockResolvedValueOnce({ data: chains });

    await expect(getSafeChainsList()).rejects.toThrow('network error');
    await expect(getSafeChainsList()).resolves.toEqual(chains);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });
});
