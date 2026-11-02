import Engine from '../core/Engine';
import {
  isDefaultAccountName,
  getCachedENSName,
  doENSReverseLookup,
  ENSCache,
} from './ENSUtils';

jest.mock('ethjs-ens');

jest.mock('../core/Engine', () => ({
  context: {
    NetworkController: {
      getProviderAndBlockTracker: jest.fn(),
    },
  },
}));

const MockENS = jest.requireMock('ethjs-ens') as jest.Mock;
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
  let mockReverse: jest.Mock;
  let mockLookup: jest.Mock;

  beforeEach(() => {
    originalCacheContents = ENSCache.cache;
    ENSCache.cache = {};
    mockReverse = jest.fn().mockResolvedValue('fox.eth');
    mockLookup = jest.fn().mockResolvedValue(mockAddress);
    MockENS.mockReset();
    MockENS.mockImplementation(() => ({
      reverse: mockReverse,
      lookup: mockLookup,
    }));
    // The global test setup stubs Date.now; give the cache a real clock.
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    // A fresh provider per test forces a fresh ENS client.
    mockGetProviderAndBlockTracker.mockReturnValue({ provider: {} });
  });

  afterEach(() => {
    ENSCache.cache = originalCacheContents;
  });

  it('returns the verified ENS name and caches it under the key read back by getCachedENSName', async () => {
    expect(await doENSReverseLookup(mockAddress, mainnetChainId)).toBe(
      'fox.eth',
    );
    expect(getCachedENSName(mockAddress, mainnetChainId)).toBe('fox.eth');
  });

  it('serves repeat lookups from the cache without new RPC calls', async () => {
    await doENSReverseLookup(mockAddress, mainnetChainId);
    expect(await doENSReverseLookup(mockAddress, mainnetChainId)).toBe(
      'fox.eth',
    );
    expect(mockReverse).toHaveBeenCalledTimes(1);
    expect(mockLookup).toHaveBeenCalledTimes(1);
  });

  it('caches a missing ENS name so it is not looked up again', async () => {
    mockReverse.mockRejectedValue(new Error('ENS name not defined.'));
    expect(
      await doENSReverseLookup(mockAddress, mainnetChainId),
    ).toBeUndefined();
    expect(
      await doENSReverseLookup(mockAddress, mainnetChainId),
    ).toBeUndefined();
    expect(mockReverse).toHaveBeenCalledTimes(1);
  });

  it('looks the name up again once the cache entry is older than an hour', async () => {
    await doENSReverseLookup(mockAddress, mainnetChainId);
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000 + 60 * 60 * 1000 + 1);
    await doENSReverseLookup(mockAddress, mainnetChainId);
    expect(mockReverse).toHaveBeenCalledTimes(2);
  });

  it('shares one in-flight request between concurrent lookups of the same address', async () => {
    const results = await Promise.all([
      doENSReverseLookup(mockAddress, mainnetChainId),
      doENSReverseLookup(mockAddress, mainnetChainId),
    ]);
    expect(results).toStrictEqual(['fox.eth', 'fox.eth']);
    expect(mockReverse).toHaveBeenCalledTimes(1);
  });

  it('reuses one ENS client per provider', async () => {
    const otherAddress = '0x0000000000000000000000000000000000000002';
    mockLookup.mockImplementation(async (name: string) =>
      name === 'other.eth' ? otherAddress : mockAddress,
    );
    mockReverse.mockImplementation(async (address: string) =>
      address === otherAddress ? 'other.eth' : 'fox.eth',
    );
    await doENSReverseLookup(mockAddress, mainnetChainId);
    expect(await doENSReverseLookup(otherAddress, mainnetChainId)).toBe(
      'other.eth',
    );
    expect(mockReverse).toHaveBeenCalledTimes(2);
    expect(MockENS).toHaveBeenCalledTimes(1);
  });

  it('does not query ENS on unsupported chains', async () => {
    expect(await doENSReverseLookup(mockAddress, '0x89')).toBeUndefined();
    expect(MockENS).not.toHaveBeenCalled();
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
