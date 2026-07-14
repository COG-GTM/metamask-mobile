import {
  isDefaultAccountName,
  getCachedENSName,
  doENSReverseLookup,
  ENSCache,
} from './ENSUtils';
import Engine from '../core/Engine';

const mockReverse = jest.fn();
const mockLookup = jest.fn();

jest.mock('ethjs-ens', () => jest.fn());

// `ethjs-ens` ships no type declarations, so access the mocked constructor via
// `requireMock` (typed `any`) instead of importing it.
const MockedENS = jest.requireMock('ethjs-ens') as jest.Mock;

// `doENSReverseLookup` is authored in JS and assigns to `this.ens`, so type its
// `this` context for the `.call(...)` invocations below.
const reverseLookup = doENSReverseLookup as unknown as (
  this: unknown,
  address: string,
  chainId: string,
) => Promise<string | undefined>;

type CacheEntry = { name?: string; timestamp?: number };
const readCache = (key: string): CacheEntry | undefined =>
  (ENSCache.cache as Record<string, CacheEntry | undefined>)[key];

const mockAddress = '0x0000000000000000000000000000000000000001';

// Mainnet: chainId is the hex `0x1` while the legacy ENS library's network ID
// is the decimal `1`. They differ, which is why reads and writes must share a
// single key format.
const MAINNET_CHAIN_ID = '0x1';
const MAINNET_NETWORK_ID = '1';
const cacheKey = `${MAINNET_NETWORK_ID}${mockAddress}`;

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

const FIXED_NOW = 1_000_000;

describe('doENSReverseLookup', () => {
  let originalCache: typeof ENSCache.cache;

  beforeEach(() => {
    originalCache = ENSCache.cache;
    ENSCache.cache = {};
    mockReverse.mockReset();
    mockLookup.mockReset();
    // A previous suite's `jest.resetAllMocks()` clears mock implementations, so
    // re-establish the ENS constructor, a fixed clock, and the provider here.
    MockedENS.mockImplementation(() => ({
      reverse: mockReverse,
      lookup: mockLookup,
    }));
    Date.now = jest.fn(() => FIXED_NOW);
    (
      Engine.context.NetworkController as unknown as {
        getProviderAndBlockTracker: jest.Mock;
      }
    ).getProviderAndBlockTracker = jest.fn(() => ({ provider: {} }));
  });

  afterEach(() => {
    ENSCache.cache = originalCache;
  });

  it('returns a fresh cached name without issuing a reverse lookup', async () => {
    ENSCache.cache = {
      [cacheKey]: {
        name: 'cachedname.metamask.eth',
        timestamp: FIXED_NOW,
      },
    };

    const name = await doENSReverseLookup(mockAddress, MAINNET_CHAIN_ID);

    expect(name).toBe('cachedname.metamask.eth');
    expect(mockReverse).not.toHaveBeenCalled();
  });

  it('writes the resolved name under the same key that reads use', async () => {
    mockReverse.mockResolvedValue('resolvedname.metamask.eth');
    mockLookup.mockResolvedValue(mockAddress);

    const name = await reverseLookup.call({}, mockAddress, MAINNET_CHAIN_ID);

    expect(name).toBe('resolvedname.metamask.eth');
    // The write is stored under the network-ID key...
    expect(readCache(cacheKey)?.name).toBe('resolvedname.metamask.eth');
    // ...and both read paths find it (no key mismatch / cache miss).
    expect(getCachedENSName(mockAddress, MAINNET_CHAIN_ID)).toBe(
      'resolvedname.metamask.eth',
    );
    await expect(
      doENSReverseLookup(mockAddress, MAINNET_CHAIN_ID),
    ).resolves.toBe('resolvedname.metamask.eth');
  });

  it('re-issues the reverse lookup when the cached entry is stale and rewrites under the same key', async () => {
    ENSCache.cache = {
      [cacheKey]: {
        name: 'stalename.metamask.eth',
        timestamp: FIXED_NOW - 2 * 60 * 60 * 1000, // older than the 1h threshold
      },
    };
    mockReverse.mockResolvedValue('freshname.metamask.eth');
    mockLookup.mockResolvedValue(mockAddress);

    const name = await reverseLookup.call({}, mockAddress, MAINNET_CHAIN_ID);

    expect(mockReverse).toHaveBeenCalledTimes(1);
    expect(name).toBe('freshname.metamask.eth');
    expect(readCache(cacheKey)?.name).toBe('freshname.metamask.eth');
  });

  it('does not issue a reverse lookup for unsupported chain IDs', async () => {
    await reverseLookup.call({}, mockAddress, '0x12345');

    expect(mockReverse).not.toHaveBeenCalled();
    expect(readCache(cacheKey)).toBeUndefined();
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
