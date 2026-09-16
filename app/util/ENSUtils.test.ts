import {
  isDefaultAccountName,
  getCachedENSName,
  doENSReverseLookup,
  ENSCache,
} from './ENSUtils';

const mockReverse = jest.fn();
const mockLookup = jest.fn();

jest.mock(
  'ethjs-ens',
  () =>
    class MockENS {
      reverse = mockReverse;
      lookup = mockLookup;
    },
);

jest.mock('../core/Engine', () => ({
  context: {
    NetworkController: {
      getProviderAndBlockTracker: () => ({ provider: {} }),
    },
  },
}));

const mockAddress = '0x0000000000000000000000000000000000000001';

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
  const chainId = '0x1';
  const networkId = '1';

  beforeEach(() => {
    originalCacheContents = ENSCache.cache;
    ENSCache.cache = {};
    mockReverse.mockReset();
    mockLookup.mockReset();
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    ENSCache.cache = originalCacheContents;
  });

  it('performs a network lookup and caches the result on a cache miss', async () => {
    mockReverse.mockResolvedValue('name.eth');
    mockLookup.mockResolvedValue(mockAddress);

    const name = await doENSReverseLookup(mockAddress, chainId);

    expect(name).toBe('name.eth');
    expect(mockReverse).toHaveBeenCalledTimes(1);
    expect(mockLookup).toHaveBeenCalledTimes(1);
    expect(ENSCache.cache).toEqual({
      [`${networkId}${mockAddress}`]: {
        name: 'name.eth',
        timestamp: 1_700_000_000_000,
      },
    });
  });

  it('returns the cached name without a network call on a repeat lookup', async () => {
    mockReverse.mockResolvedValue('name.eth');
    mockLookup.mockResolvedValue(mockAddress);

    await doENSReverseLookup(mockAddress, chainId);
    const name = await doENSReverseLookup(mockAddress, chainId);

    expect(name).toBe('name.eth');
    expect(mockReverse).toHaveBeenCalledTimes(1);
    expect(mockLookup).toHaveBeenCalledTimes(1);
  });

  it('returns undefined from cache after a "not defined" error without retrying', async () => {
    mockReverse.mockRejectedValue(new Error('ENS name not defined'));

    await doENSReverseLookup(mockAddress, chainId);
    const name = await doENSReverseLookup(mockAddress, chainId);

    expect(name).toBeUndefined();
    expect(mockReverse).toHaveBeenCalledTimes(1);
  });

  it('re-fetches once the cache entry is older than the refresh threshold', async () => {
    ENSCache.cache = {
      [`${networkId}${mockAddress}`]: {
        name: 'stale.eth',
        timestamp: Date.now() - 2 * 60 * 60 * 1000,
      },
    };
    mockReverse.mockResolvedValue('fresh.eth');
    mockLookup.mockResolvedValue(mockAddress);

    const name = await doENSReverseLookup(mockAddress, chainId);

    expect(name).toBe('fresh.eth');
    expect(mockReverse).toHaveBeenCalledTimes(1);
  });

  it('does not perform a lookup on unsupported chains', async () => {
    const name = await doENSReverseLookup(mockAddress, '0x5');

    expect(name).toBeUndefined();
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
