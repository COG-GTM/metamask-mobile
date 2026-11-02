import {
  isDefaultAccountName,
  getCachedENSName,
  doENSReverseLookup,
  ENSCache,
} from './ENSUtils';

jest.mock('../core/Engine', () => ({
  context: {
    NetworkController: {
      getProviderAndBlockTracker: () => ({ provider: {} }),
    },
  },
}));

const mockReverse = jest.fn();
const mockLookup = jest.fn();
jest.mock('ethjs-ens', () => jest.fn());
const mockENS = jest.requireMock<jest.Mock>('ethjs-ens');

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
  // testSetup stubs Date.now to a constant; use a controllable clock.
  let now: number;

  beforeEach(() => {
    now = new Date('2026-01-01T00:00:00Z').getTime();
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    originalCacheContents = ENSCache.cache;
    ENSCache.cache = {};
    mockReverse.mockReset();
    mockLookup.mockReset();
    mockENS.mockImplementation(() => ({
      reverse: mockReverse,
      lookup: mockLookup,
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    ENSCache.cache = originalCacheContents;
  });

  it('serves repeat mainnet lookups from the cache without RPC calls', async () => {
    mockReverse.mockResolvedValue('test.eth');
    mockLookup.mockResolvedValue(mockAddress);

    expect(await doENSReverseLookup(mockAddress, '0x1')).toBe('test.eth');
    expect(await doENSReverseLookup(mockAddress, '0x1')).toBe('test.eth');
    expect(await doENSReverseLookup(mockAddress, '0x1')).toBe('test.eth');

    expect(mockReverse).toHaveBeenCalledTimes(1);
    expect(mockLookup).toHaveBeenCalledTimes(1);
    expect(getCachedENSName(mockAddress, '0x1')).toBe('test.eth');
  });

  it('uses entries written by getCachedENSName key format', async () => {
    ENSCache.cache = {
      [`1${mockAddress}`]: { name: 'seeded.eth', timestamp: Date.now() },
    };

    expect(await doENSReverseLookup(mockAddress, '0x1')).toBe('seeded.eth');
    expect(mockReverse).not.toHaveBeenCalled();
  });

  it('caches a not-defined result so it is not re-queried', async () => {
    mockReverse.mockRejectedValue(new Error('ENS name not defined.'));

    expect(await doENSReverseLookup(mockAddress, '0x1')).toBeUndefined();
    expect(await doENSReverseLookup(mockAddress, '0x1')).toBeUndefined();

    expect(mockReverse).toHaveBeenCalledTimes(1);
  });

  it('does not cache names whose forward lookup does not match', async () => {
    mockReverse.mockResolvedValue('spoof.eth');
    mockLookup.mockResolvedValue('0x0000000000000000000000000000000000000002');

    expect(await doENSReverseLookup(mockAddress, '0x1')).toBeUndefined();
    expect(await doENSReverseLookup(mockAddress, '0x1')).toBeUndefined();

    expect(mockReverse).toHaveBeenCalledTimes(2);
    expect(getCachedENSName(mockAddress, '0x1')).toBeUndefined();
  });

  it('refreshes entries older than one hour', async () => {
    mockReverse.mockResolvedValue('test.eth');
    mockLookup.mockResolvedValue(mockAddress);

    await doENSReverseLookup(mockAddress, '0x1');
    now += 59 * 60 * 1000;
    await doENSReverseLookup(mockAddress, '0x1');
    expect(mockReverse).toHaveBeenCalledTimes(1);

    now += 2 * 60 * 1000;
    await doENSReverseLookup(mockAddress, '0x1');

    expect(mockReverse).toHaveBeenCalledTimes(2);
  });

  it('returns undefined without RPC calls on chains without ENS support', async () => {
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
