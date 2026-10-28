import axios from 'axios';
import {
  SAFE_CHAINS_LIST_TTL_MS,
  SAFE_CHAINS_LIST_URL,
  clearSafeChainsListCache,
  getSafeChainsList,
} from './safeChainsList';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const SAFE_CHAINS = [
  {
    chainId: 1,
    name: 'Ethereum Mainnet',
    nativeCurrency: { symbol: 'ETH', decimals: 18 },
    rpc: ['https://cloudflare-eth.com'],
  },
];

describe('getSafeChainsList', () => {
  beforeEach(() => {
    clearSafeChainsListCache();
    mockedAxios.get.mockReset();
    jest.restoreAllMocks();
  });

  it('downloads chains.json once and shares the result between callers', async () => {
    mockedAxios.get.mockResolvedValue({ data: SAFE_CHAINS });

    const [first, second] = await Promise.all([
      getSafeChainsList(),
      getSafeChainsList(),
    ]);
    const third = await getSafeChainsList();

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(SAFE_CHAINS_LIST_URL);
    expect(first).toBe(SAFE_CHAINS);
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it('downloads again after the TTL expires', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    mockedAxios.get.mockResolvedValue({ data: SAFE_CHAINS });

    await getSafeChainsList();
    now.mockReturnValue(1_000 + SAFE_CHAINS_LIST_TTL_MS - 1);
    await getSafeChainsList();
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    now.mockReturnValue(1_000 + SAFE_CHAINS_LIST_TTL_MS);
    await getSafeChainsList();
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('does not cache failed downloads', async () => {
    mockedAxios.get
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ data: SAFE_CHAINS });

    await expect(getSafeChainsList()).rejects.toThrow('offline');
    await expect(getSafeChainsList()).resolves.toBe(SAFE_CHAINS);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });
});
