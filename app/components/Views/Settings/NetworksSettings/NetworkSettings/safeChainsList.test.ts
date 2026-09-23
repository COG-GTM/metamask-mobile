import axios from 'axios';
import {
  getSafeChainsList,
  resetSafeChainsListCache,
  SafeChain,
} from './safeChainsList';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const SAFE_CHAINS_LIST: SafeChain[] = [
  { chainId: 1, nativeCurrency: { symbol: 'ETH' } },
];

const deferred = () => {
  let resolve: (value: { data: SafeChain[] }) => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<{ data: SafeChain[] }>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('safeChainsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSafeChainsListCache();
  });

  it('shares one in-flight request between simultaneous subscribers', async () => {
    const request = deferred();
    mockedAxios.get.mockReturnValueOnce(request.promise);

    const first = getSafeChainsList();
    const second = getSafeChainsList();
    request.resolve({ data: SAFE_CHAINS_LIST });

    await expect(first.promise).resolves.toBe(SAFE_CHAINS_LIST);
    await expect(second.promise).resolves.toBe(SAFE_CHAINS_LIST);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    first.release();
    second.release();
  });

  it('keeps the request alive while another subscriber is waiting', () => {
    const request = deferred();
    mockedAxios.get.mockReturnValueOnce(request.promise);

    const first = getSafeChainsList();
    const second = getSafeChainsList();
    first.release();

    const signal = mockedAxios.get.mock.calls[0][1]?.signal as AbortSignal;
    expect(signal.aborted).toBe(false);

    second.release();
    expect(signal.aborted).toBe(true);
  });

  it('aborts the in-flight request once every subscriber releases', () => {
    mockedAxios.get.mockReturnValueOnce(deferred().promise);

    getSafeChainsList().release();

    const signal = mockedAxios.get.mock.calls[0][1]?.signal as AbortSignal;
    expect(signal.aborted).toBe(true);
  });

  it('does not let a cancelled request evict the replacement request', async () => {
    const cancelled = deferred();
    const replacement = deferred();
    mockedAxios.get
      .mockReturnValueOnce(cancelled.promise)
      .mockReturnValueOnce(replacement.promise);

    const first = getSafeChainsList();
    first.promise.catch(() => undefined);
    first.release();

    const second = getSafeChainsList();
    cancelled.reject(new Error('aborted'));
    await expect(cancelled.promise).rejects.toThrow('aborted');

    const third = getSafeChainsList();
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);

    replacement.resolve({ data: SAFE_CHAINS_LIST });
    await expect(second.promise).resolves.toBe(SAFE_CHAINS_LIST);
    await expect(third.promise).resolves.toBe(SAFE_CHAINS_LIST);

    second.release();
    third.release();
  });
});
