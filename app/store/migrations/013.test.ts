import migrate from './013';
import { captureException } from '@sentry/react-native';

jest.mock('uuid', () => ({
  v1: () => 'mock-id',
}));
jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

describe('Migration #13', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('captures exception and returns state unchanged for invalid root state', () => {
    const state = null;
    expect(migrate(state)).toStrictEqual(state);
    expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockedCaptureException.mock.calls[0][0].message).toContain(
      'Migration 13',
    );
  });

  it('captures exception and returns state unchanged for invalid engine state', () => {
    const state = { engine: null };
    expect(migrate(state)).toStrictEqual(state);
    expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockedCaptureException.mock.calls[0][0].message).toContain(
      'Migration 13',
    );
  });

  it('migrates state', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    const state = {
      privacy: {
        approvedHosts: {
          'a.com': true,
          'b.com': true,
        },
      },
      engine: {
        backgroundState: {
          PreferencesController: {
            selectedAddress: '0x1',
          },
        },
      },
    };

    expect(migrate(state)).toStrictEqual({
      privacy: {
        approvedHosts: {
          'a.com': true,
          'b.com': true,
        },
      },
      engine: {
        backgroundState: {
          PreferencesController: {
            selectedAddress: '0x1',
          },
          PermissionController: {
            subjects: {
              'a.com': {
                origin: 'a.com',
                permissions: {
                  eth_accounts: {
                    id: 'mock-id',
                    parentCapability: 'eth_accounts',
                    invoker: 'a.com',
                    caveats: [
                      {
                        type: 'restrictReturnedAccounts',
                        value: [{ address: '0x1', lastUsed: 1000 }],
                      },
                    ],
                    date: 1000,
                  },
                },
              },
              'b.com': {
                origin: 'b.com',
                permissions: {
                  eth_accounts: {
                    id: 'mock-id',
                    parentCapability: 'eth_accounts',
                    invoker: 'b.com',
                    caveats: [
                      {
                        type: 'restrictReturnedAccounts',
                        value: [{ address: '0x1', lastUsed: 999 }],
                      },
                    ],
                    date: 1000,
                  },
                },
              },
            },
          },
        },
      },
    });
  });

  it('returns the same state when PermissionController subjects already exist', () => {
    const state = {
      engine: {
        backgroundState: {
          PermissionController: {
            subjects: {
              existing: {},
            },
          },
        },
      },
    };

    expect(migrate(state)).toBe(state);
  });

  it('returns the same state when there are no approved hosts', () => {
    const state = {
      privacy: {
        approvedHosts: {},
      },
      engine: {
        backgroundState: {
          PreferencesController: {
            selectedAddress: '0x1',
          },
        },
      },
    };

    expect(migrate(state)).toBe(state);
  });
});
