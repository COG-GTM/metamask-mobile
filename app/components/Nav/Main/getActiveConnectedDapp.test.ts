import { RootState } from '../../../reducers';
import { getActiveConnectedDapp } from './getActiveConnectedDapp';
import { getPermittedAccountsByHostname } from '../../../core/Permissions';
import Logger from '../../../util/Logger';

jest.mock('../../../core/Permissions', () => ({
  getPermittedAccountsByHostname: jest.fn(),
}));

jest.mock('../../../util/Logger', () => ({
  error: jest.fn(),
}));

const mockGetPermittedAccountsByHostname =
  getPermittedAccountsByHostname as jest.Mock;

const permissionControllerState = { subjects: {} };

const buildState = (
  tabs: { id: number; url: string }[],
  activeTab: number | null,
) =>
  ({
    browser: { tabs, activeTab },
    engine: {
      backgroundState: {
        PermissionController: permissionControllerState,
      },
    },
  } as unknown as RootState);

describe('getActiveConnectedDapp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty array when there is no active tab', () => {
    expect(
      getActiveConnectedDapp(
        buildState([{ id: 1, url: 'https://a.io' }], null),
      ),
    ).toEqual([]);
    expect(mockGetPermittedAccountsByHostname).not.toHaveBeenCalled();
  });

  it('returns an empty array when the active tab URL is not a URL', () => {
    expect(
      getActiveConnectedDapp(buildState([{ id: 1, url: 'not a url' }], 1)),
    ).toEqual([]);
    expect(mockGetPermittedAccountsByHostname).not.toHaveBeenCalled();
  });

  it('looks up permitted accounts by the active tab hostname', () => {
    mockGetPermittedAccountsByHostname.mockReturnValue(['0xabc']);
    const state = buildState(
      [
        { id: 1, url: 'https://other.io/x' },
        { id: 2, url: 'https://app.uniswap.org/swap?x=1' },
      ],
      2,
    );

    expect(getActiveConnectedDapp(state)).toEqual(['0xabc']);
    expect(mockGetPermittedAccountsByHostname).toHaveBeenCalledTimes(1);
    expect(mockGetPermittedAccountsByHostname).toHaveBeenCalledWith(
      permissionControllerState,
      'app.uniswap.org',
    );
  });

  it('logs and returns undefined when the lookup throws', () => {
    const error = new Error('boom');
    mockGetPermittedAccountsByHostname.mockImplementation(() => {
      throw error;
    });

    expect(
      getActiveConnectedDapp(buildState([{ id: 1, url: 'https://a.io' }], 1)),
    ).toBeUndefined();
    expect(Logger.error).toHaveBeenCalledWith(error, {
      message: 'ParseUrl::MainNavigator error while parsing URL',
    });
  });
});
