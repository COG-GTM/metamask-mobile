import {
  isDefaultAccountName,
  getCachedENSName,
  doENSReverseLookup,
  ENSCache,
} from './ENSUtils';

const mockAddress = '0x0000000000000000000000000000000000000001';

// Spies on the ENS RPC calls so tests can assert how many round trips a
// lookup actually performs.
const mockReverse = jest.fn();
const mockLookup = jest.fn();

jest.mock(
  'ethjs-ens',
  () =>
    class MockENS {
      reverse(address: string) {
        return mockReverse(address);
      }
      lookup(name: string) {
        return mockLookup(name);
      }
    },
);

jest.mock('../core/Engine', () => ({
  context: {
    NetworkController: {
      getProviderAndBlockTracker: () => ({ provider: {} }),
    },
  },
}));

// TODO: Stub this in individual tests using `jest.replaceProperty` after the
// update to Jest v29
let originalCacheContents: typeof ENSCache.cache;

describe('getCachedENSName', () => {
  beforeEach(() => {
    originalCacheContents = ENSCache.cache;
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    // This prevents
    ENSCache.cache = originalCacheContents;
  });

  it('returns undefined for unsupported chain IDs', () => {
    ENSCache.cache = {};

    expect(getCachedENSName(mockAddress, '12345')).toBeUndefined();
  });

  it('returns undefined if there is no cached entry', () => {
    ENSCache.cache = {};

    expect(getCachedENSName(mockAddress, '1')).toBeUndefined();
  });

  it('returns a cached ENS name', () => {
    const networkId = '1';
    const chainId = '0x1';
    ENSCache.cache = {
      [`${networkId}${mockAddress}`]: {
        name: 'cachedname.metamask.eth',
        timestamp: Date.now(),
      },
    };

    expect(getCachedENSName(mockAddress, chainId)).toBe(
      'cachedname.metamask.eth',
    );
  });
});

describe('doENSReverseLookup', () => {
  const mainnetChainId = '0x1';
  const mainnetNetworkId = '1';
  const ensName = 'cachedname.metamask.eth';
  // Fixed clock so cache timestamps are deterministic and TTL math is exact.
  const now = 1_700_000_000_000;
  const getCache = () =>
    ENSCache.cache as Record<string, { name?: string; timestamp: number }>;

  beforeEach(() => {
    // Start every test from an empty cache and restore the module-level cache
    // afterwards so suites do not leak entries into each other.
    originalCacheContents = ENSCache.cache;
    ENSCache.cache = {};
    mockReverse.mockReset();
    mockLookup.mockReset();
    jest.spyOn(Date, 'now').mockReturnValue(now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    ENSCache.cache = originalCacheContents;
  });

  it('resolves via RPC and writes the cache under the network ID key', async () => {
    mockReverse.mockResolvedValue(ensName);
    mockLookup.mockResolvedValue(mockAddress);

    const name = await doENSReverseLookup(mockAddress, mainnetChainId);

    expect(name).toBe(ensName);
    expect(mockReverse).toHaveBeenCalledTimes(1);
    expect(mockLookup).toHaveBeenCalledTimes(1);
    expect(getCache()[`${mainnetNetworkId}${mockAddress}`]?.name).toBe(ensName);
    expect(getCache()[`${mainnetChainId}${mockAddress}`]).toBeUndefined();
  });

  it('serves repeated lookups from the cache without additional RPCs', async () => {
    mockReverse.mockResolvedValue(ensName);
    mockLookup.mockResolvedValue(mockAddress);

    const first = await doENSReverseLookup(mockAddress, mainnetChainId);
    const second = await doENSReverseLookup(mockAddress, mainnetChainId);
    const third = await doENSReverseLookup(mockAddress, mainnetChainId);

    expect([first, second, third]).toEqual([ensName, ensName, ensName]);
    expect(mockReverse).toHaveBeenCalledTimes(1);
    expect(mockLookup).toHaveBeenCalledTimes(1);
  });

  it('returns a name previously cached by the network ID key', async () => {
    ENSCache.cache = {
      [`${mainnetNetworkId}${mockAddress}`]: {
        name: ensName,
        timestamp: now,
      },
    };

    expect(await doENSReverseLookup(mockAddress, mainnetChainId)).toBe(ensName);
    expect(mockReverse).not.toHaveBeenCalled();
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it('caches negative results so unresolved addresses are not re-queried', async () => {
    mockReverse.mockRejectedValue(new Error('ENS name not defined.'));

    const first = await doENSReverseLookup(mockAddress, mainnetChainId);
    const second = await doENSReverseLookup(mockAddress, mainnetChainId);

    expect(first).toBeUndefined();
    expect(second).toBeUndefined();
    expect(mockReverse).toHaveBeenCalledTimes(1);
    expect(getCache()[`${mainnetNetworkId}${mockAddress}`]).toEqual({
      timestamp: now,
    });
  });

  it('re-queries once the cache entry is older than the refresh threshold', async () => {
    ENSCache.cache = {
      [`${mainnetNetworkId}${mockAddress}`]: {
        name: ensName,
        timestamp: now - 2 * 60 * 60 * 1000,
      },
    };
    mockReverse.mockResolvedValue(ensName);
    mockLookup.mockResolvedValue(mockAddress);

    expect(await doENSReverseLookup(mockAddress, mainnetChainId)).toBe(ensName);
    expect(mockReverse).toHaveBeenCalledTimes(1);
  });

  it('does not return a mainnet-cached name for an unsupported chain', async () => {
    ENSCache.cache = {
      [`${mainnetNetworkId}${mockAddress}`]: {
        name: ensName,
        timestamp: now,
      },
    };

    expect(await doENSReverseLookup(mockAddress, '0x89')).toBeUndefined();
    expect(mockReverse).not.toHaveBeenCalled();
  });
});

describe('isDefaultAccountName', () => {
  const accountNameDefaultOne = 'Account 1';
  it('should match RegEx if name "Account 1" has default pattern', () => {
    expect(isDefaultAccountName(accountNameDefaultOne)).toEqual(true);
  });
  const accountNameDefaultTwo = 'Account 99999';
  it('should match RegEx if name "Account 99999" has default pattern', () => {
    expect(isDefaultAccountName(accountNameDefaultTwo)).toEqual(true);
  });
  const accountNameEmpty = '';
  it('should not match RegEx if name is empty', () => {
    expect(isDefaultAccountName(accountNameEmpty)).toEqual(false);
  });
  const accountNameUndefined = undefined;
  it('should not match RegEx if name is undefined', () => {
    expect(isDefaultAccountName(accountNameUndefined)).toEqual(false);
  });
  const accountNameNotDefault = 'Johns Wallet';
  it('should not match RegEx if name does not has default pattern', () => {
    expect(isDefaultAccountName(accountNameNotDefault)).toEqual(false);
  });
});
