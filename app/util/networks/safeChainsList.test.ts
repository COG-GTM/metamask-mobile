import axios from 'axios';
import {
  getSafeChainByChainId,
  getSafeChainsList,
  resetSafeChainsListCache,
  SAFE_CHAINS_LIST_TTL_MS,
} from './safeChainsList';

describe('safeChainsList', () => {
  const safeChainsList = [
    {
      chainId: 1,
      name: 'Ethereum',
      nativeCurrency: { symbol: 'ETH', decimals: 18 },
      rpc: ['https://ethereum.example'],
    },
    {
      chainId: '137',
      name: 'Polygon',
      nativeCurrency: { symbol: 'MATIC', decimals: 18 },
      rpc: ['https://polygon.example'],
    },
  ];

  beforeEach(() => {
    resetSafeChainsListCache();
    jest.restoreAllMocks();
  });

  it('shares one request between concurrent callers', async () => {
    const spyGet = jest
      .spyOn(axios, 'get')
      .mockResolvedValue({ data: safeChainsList });

    const firstRequest = getSafeChainsList();
    const secondRequest = getSafeChainsList();
    const [firstList, secondList] = await Promise.all([
      firstRequest,
      secondRequest,
    ]);

    expect(spyGet).toHaveBeenCalledTimes(1);
    expect(firstList).toBe(secondList);
  });

  it('uses the cached list within the TTL', async () => {
    const spyGet = jest
      .spyOn(axios, 'get')
      .mockResolvedValue({ data: safeChainsList });

    await getSafeChainsList();
    const cachedList = await getSafeChainsList();

    expect(spyGet).toHaveBeenCalledTimes(1);
    expect(cachedList).toBe(safeChainsList);
  });

  it('refetches after the TTL expires', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
    const refreshedList = [...safeChainsList];
    const spyGet = jest
      .spyOn(axios, 'get')
      .mockResolvedValueOnce({ data: safeChainsList })
      .mockResolvedValueOnce({ data: refreshedList });

    await getSafeChainsList();
    now.mockReturnValue(1000 + SAFE_CHAINS_LIST_TTL_MS);
    const result = await getSafeChainsList();

    expect(spyGet).toHaveBeenCalledTimes(2);
    expect(result).toBe(refreshedList);
  });

  it('does not cache rejected requests', async () => {
    const error = new Error('request failed');
    const spyGet = jest
      .spyOn(axios, 'get')
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ data: safeChainsList });

    await expect(getSafeChainsList()).rejects.toBe(error);
    await expect(getSafeChainsList()).resolves.toBe(safeChainsList);

    expect(spyGet).toHaveBeenCalledTimes(2);
  });

  it('finds chains by string or number chain id', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({ data: safeChainsList });

    await expect(getSafeChainByChainId(1)).resolves.toBe(safeChainsList[0]);
    await expect(getSafeChainByChainId('137')).resolves.toBe(
      safeChainsList[1],
    );
    await expect(getSafeChainByChainId('999')).resolves.toBeUndefined();
  });
});
