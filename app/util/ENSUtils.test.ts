import ENS from 'ethjs-ens';
import Engine from '../core/Engine';
import {
  isDefaultAccountName,
  getCachedENSName,
  doENSReverseLookup,
  doENSLookup,
  ENSCache,
} from './ENSUtils';

jest.mock('ethjs-ens', () => jest.fn());

jest.mock('../core/Engine', () => ({
  context: {
    NetworkController: {
      getProviderAndBlockTracker: jest.fn(),
    },
  },
}));

const MockENS = ENS as unknown as jest.Mock;
const mockGetProviderAndBlockTracker = Engine.context.NetworkController
  .getProviderAndBlockTracker as jest.Mock;

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
  const mainnetChainId = '0x1';
  const mainnetNetworkId = '1';
  const ensName = 'cachedname.metamask.eth';
  let mockReverse: jest.Mock;
  let mockLookup: jest.Mock;
  let mockProvider: object;
  let nowSpy: jest.SpyInstance;
  const start = 1_700_000_000_000;

  beforeEach(() => {
    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(start);
    originalCacheContents = ENSCache.cache;
    ENSCache.cache = {};
    mockProvider = {};
    mockReverse = jest.fn().mockResolvedValue(ensName);
    mockLookup = jest.fn().mockResolvedValue(mockAddress);
    MockENS.mockImplementation(() => ({
      reverse: mockReverse,
      lookup: mockLookup,
    }));
    mockGetProviderAndBlockTracker.mockReturnValue({ provider: mockProvider });
  });

  afterEach(() => {
    jest.clearAllMocks();
    nowSpy.mockRestore();
    ENSCache.cache = originalCacheContents;
  });

  it('resolves and caches the name under the networkId key', async () => {
    expect(await doENSReverseLookup(mockAddress, mainnetChainId)).toBe(ensName);

    expect(mockReverse).toHaveBeenCalledWith(mockAddress);
    expect(mockLookup).toHaveBeenCalledWith(ensName);
    expect(ENSCache.cache).toEqual({
      [`${mainnetNetworkId}${mockAddress}`]: {
        name: ensName,
        timestamp: start,
      },
    });
    expect(getCachedENSName(mockAddress, mainnetChainId)).toBe(ensName);
  });

  it('serves repeat lookups from the cache without RPC calls', async () => {
    await doENSReverseLookup(mockAddress, mainnetChainId);
    mockReverse.mockClear();
    mockLookup.mockClear();

    expect(await doENSReverseLookup(mockAddress, mainnetChainId)).toBe(ensName);
    expect(mockReverse).not.toHaveBeenCalled();
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it('returns a fresh entry written by another caller without RPC calls', async () => {
    ENSCache.cache = {
      [`${mainnetNetworkId}${mockAddress}`]: {
        name: 'other.eth',
        timestamp: start - 1000,
      },
    };

    expect(await doENSReverseLookup(mockAddress, mainnetChainId)).toBe(
      'other.eth',
    );
    expect(mockReverse).not.toHaveBeenCalled();
  });

  it('caches a not-found result so it is not re-requested', async () => {
    mockReverse.mockRejectedValue(new Error('ENS name not defined.'));

    expect(
      await doENSReverseLookup(mockAddress, mainnetChainId),
    ).toBeUndefined();
    expect(
      await doENSReverseLookup(mockAddress, mainnetChainId),
    ).toBeUndefined();
    expect(mockReverse).toHaveBeenCalledTimes(1);
  });

  it('refreshes stale cache entries', async () => {
    await doENSReverseLookup(mockAddress, mainnetChainId);

    nowSpy.mockReturnValue(start + 60 * 60 * 1000 + 1);
    mockReverse.mockResolvedValue('renamed.eth');
    mockLookup.mockResolvedValue(mockAddress);

    expect(await doENSReverseLookup(mockAddress, mainnetChainId)).toBe(
      'renamed.eth',
    );
    expect(mockReverse).toHaveBeenCalledTimes(2);
  });

  it('does not cache a name whose forward lookup does not match', async () => {
    mockLookup.mockResolvedValue('0x0000000000000000000000000000000000000002');

    expect(
      await doENSReverseLookup(mockAddress, mainnetChainId),
    ).toBeUndefined();
    expect(ENSCache.cache).toEqual({});
  });

  it('does nothing on chains without ENS support', async () => {
    expect(await doENSReverseLookup(mockAddress, '0x89')).toBeUndefined();
    expect(mockGetProviderAndBlockTracker).not.toHaveBeenCalled();
    expect(MockENS).not.toHaveBeenCalled();
  });

  it('reuses the ENS instance while the provider is unchanged', async () => {
    const otherAddress = '0x0000000000000000000000000000000000000003';
    mockLookup.mockImplementation(async () => mockAddress);
    await doENSReverseLookup(mockAddress, mainnetChainId);
    await doENSReverseLookup(otherAddress, mainnetChainId);
    await doENSLookup(ensName, mainnetChainId);
    expect(MockENS).toHaveBeenCalledTimes(1);
    expect(MockENS).toHaveBeenCalledWith({
      provider: mockProvider,
      network: mainnetNetworkId,
    });

    mockGetProviderAndBlockTracker.mockReturnValue({ provider: {} });
    await doENSReverseLookup(
      '0x0000000000000000000000000000000000000004',
      mainnetChainId,
    );
    expect(MockENS).toHaveBeenCalledTimes(2);
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
