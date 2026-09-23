import {
  isDefaultAccountName,
  getCachedENSName,
  doENSLookup,
  ENSCache,
} from './ENSUtils';
import Logger from './Logger';

const mockLookup = jest.fn();

jest.mock('ethjs-ens', () => jest.fn());

const mockENS = jest.requireMock('ethjs-ens') as jest.Mock;

jest.mock('../core/Engine', () => ({
  context: {
    NetworkController: {
      getProviderAndBlockTracker: () => ({ provider: {} }),
    },
  },
}));

jest.mock('./Logger', () => ({
  error: jest.fn(),
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

describe('doENSLookup', () => {
  const chainId = '0x1';

  beforeEach(() => {
    jest.clearAllMocks();
    mockENS.mockImplementation(() => ({ lookup: mockLookup }));
  });

  it('returns the resolved address', async () => {
    mockLookup.mockResolvedValue(mockAddress);

    expect(await doENSLookup('vitalik.eth', chainId)).toBe(mockAddress);
    expect(Logger.error).not.toHaveBeenCalled();
  });

  it('returns undefined without logging for an unregistered name', async () => {
    mockLookup.mockRejectedValue(new Error('ENS name not defined'));

    expect(await doENSLookup('unregistered.eth', chainId)).toBeUndefined();
    expect(Logger.error).not.toHaveBeenCalled();
  });

  it('returns undefined without logging for an invalid name', async () => {
    mockLookup.mockRejectedValue(new Error('invalid ENS name'));

    expect(await doENSLookup('not a name', chainId)).toBeUndefined();
    expect(Logger.error).not.toHaveBeenCalled();
  });

  it('logs unexpected provider or resolver failures', async () => {
    const error = new Error('could not detect network');
    mockLookup.mockRejectedValue(error);

    expect(await doENSLookup('vitalik.eth', chainId)).toBeUndefined();
    expect(Logger.error).toHaveBeenCalledWith(error, {
      message: 'ENS lookup failed',
      chainId,
    });
  });

  it('does not perform a lookup on networks without ENS support', async () => {
    expect(await doENSLookup('vitalik.eth', '0x5')).toBeUndefined();
    expect(mockLookup).not.toHaveBeenCalled();
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
