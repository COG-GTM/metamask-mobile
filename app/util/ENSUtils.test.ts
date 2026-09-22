import {
  isDefaultAccountName,
  getCachedENSName,
  doENSReverseLookup,
  ENSCache,
} from './ENSUtils';

const mockAddress = '0x0000000000000000000000000000000000000001';
const mockChainId = '0x1';
const mockReverse = jest.fn();
const mockLookup = jest.fn();

jest.mock('ethjs-ens', () =>
  jest.fn().mockImplementation(() => ({
    reverse: mockReverse,
    lookup: mockLookup,
  })),
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
  const ensConstructorMock = jest.requireMock('ethjs-ens') as jest.Mock;

  beforeEach(() => {
    originalCacheContents = ENSCache.cache;
    ENSCache.cache = {};
    // `jest.resetAllMocks` above wipes the global `Date.now` mock set up in
    // testSetup, and cache entries are timestamped with it.
    jest.spyOn(Date, 'now').mockReturnValue(123);
    ensConstructorMock.mockImplementation(() => ({
      reverse: mockReverse,
      lookup: mockLookup,
    }));
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    ENSCache.cache = originalCacheContents;
  });

  it('returns undefined for unsupported chain IDs', async () => {
    expect(await doENSReverseLookup(mockAddress, '12345')).toBeUndefined();
    expect(mockReverse).not.toHaveBeenCalled();
  });

  it('caches a resolved name under the same key used by getCachedENSName', async () => {
    mockReverse.mockResolvedValue('resolved.metamask.eth');
    mockLookup.mockResolvedValue(mockAddress);

    expect(await doENSReverseLookup(mockAddress, mockChainId)).toBe(
      'resolved.metamask.eth',
    );
    expect(getCachedENSName(mockAddress, mockChainId)).toBe(
      'resolved.metamask.eth',
    );
  });

  it('reuses the cached name instead of re-issuing a reverse lookup', async () => {
    mockReverse.mockResolvedValue('resolved.metamask.eth');
    mockLookup.mockResolvedValue(mockAddress);

    await doENSReverseLookup(mockAddress, mockChainId);
    expect(await doENSReverseLookup(mockAddress, mockChainId)).toBe(
      'resolved.metamask.eth',
    );
    expect(mockReverse).toHaveBeenCalledTimes(1);
  });

  it('caches a negative result when the name is not defined', async () => {
    mockReverse.mockRejectedValue(new Error('ENS name not defined'));

    expect(await doENSReverseLookup(mockAddress, mockChainId)).toBeUndefined();
    expect(await doENSReverseLookup(mockAddress, mockChainId)).toBeUndefined();
    expect(mockReverse).toHaveBeenCalledTimes(1);
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
