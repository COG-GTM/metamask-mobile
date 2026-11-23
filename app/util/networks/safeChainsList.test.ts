import axios from 'axios';
import {
  getSafeChainsList,
  resetSafeChainsListCache,
  SAFE_CHAINS_LIST_TIMEOUT_MS,
  SAFE_CHAINS_LIST_TTL_MS,
  SAFE_CHAINS_LIST_URL,
} from './safeChainsList';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const chains = [{ chainId: 1, name: 'Ethereum Mainnet' }];

describe('getSafeChainsList', () => {
  beforeEach(() => {
    resetSafeChainsListCache();
    mockedAxios.get.mockReset();
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requests chains.json with a timeout', async () => {
    mockedAxios.get.mockResolvedValue({ data: chains });

    await expect(getSafeChainsList()).resolves.toBe(chains);
    expect(mockedAxios.get).toHaveBeenCalledWith(SAFE_CHAINS_LIST_URL, {
      timeout: SAFE_CHAINS_LIST_TIMEOUT_MS,
    });
  });

  it('shares one in-flight request between concurrent callers', async () => {
    mockedAxios.get.mockResolvedValue({ data: chains });

    const [a, b, c] = await Promise.all([
      getSafeChainsList(),
      getSafeChainsList(),
      getSafeChainsList(),
    ]);

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(a).toBe(chains);
    expect(b).toBe(chains);
    expect(c).toBe(chains);
  });

  it('reuses the resolved list until the TTL expires', async () => {
    mockedAxios.get.mockResolvedValue({ data: chains });

    await getSafeChainsList();
    (Date.now as jest.Mock).mockReturnValue(
      1_000_000 + SAFE_CHAINS_LIST_TTL_MS - 1,
    );
    await getSafeChainsList();
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    (Date.now as jest.Mock).mockReturnValue(
      1_000_000 + SAFE_CHAINS_LIST_TTL_MS,
    );
    await getSafeChainsList();
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('does not cache a failed request', async () => {
    mockedAxios.get
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ data: chains });

    await expect(getSafeChainsList()).rejects.toThrow('network');
    await expect(getSafeChainsList()).resolves.toBe(chains);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('rejects instead of throwing when the request throws synchronously', async () => {
    mockedAxios.get.mockImplementationOnce(() => {
      throw new Error('sync');
    });

    await expect(getSafeChainsList()).rejects.toThrow('sync');
  });

  it('rejects and does not cache a non-array response', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: '<html>' })
      .mockResolvedValueOnce({ data: chains });

    await expect(getSafeChainsList()).rejects.toThrow(
      'Invalid safe chains list response',
    );
    await expect(getSafeChainsList()).resolves.toBe(chains);
  });
});
