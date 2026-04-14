import migrate from './013';

jest.mock('uuid', () => ({
  v1: jest.fn(() => 'mock-uuid-v1'),
}));

describe('Migration #13', () => {
  it('should create PermissionController from approvedHosts', () => {
    const oldState = {
      privacy: {
        approvedHosts: {
          'example.com': true,
        },
      },
      engine: {
        backgroundState: {
          PreferencesController: {
            selectedAddress: '0x1234',
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.PermissionController).toBeDefined();
    expect(newState.engine.backgroundState.PermissionController.subjects['example.com']).toBeDefined();
    expect(newState.engine.backgroundState.PermissionController.subjects['example.com'].origin).toBe('example.com');
    expect(newState.engine.backgroundState.PermissionController.subjects['example.com'].permissions.eth_accounts).toBeDefined();
  });

  it('should bail out if PermissionController already exists', () => {
    const oldState = {
      privacy: {
        approvedHosts: {
          'example.com': true,
        },
      },
      engine: {
        backgroundState: {
          PermissionController: {
            subjects: { existing: true },
          },
          PreferencesController: {
            selectedAddress: '0x1234',
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.PermissionController.subjects).toStrictEqual({ existing: true });
  });

  it('should bail out if no approved hosts', () => {
    const oldState = {
      privacy: {
        approvedHosts: {},
      },
      engine: {
        backgroundState: {
          PreferencesController: {
            selectedAddress: '0x1234',
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.PermissionController).toBeUndefined();
  });

  it('should handle multiple approved hosts', () => {
    const oldState = {
      privacy: {
        approvedHosts: {
          'dapp1.com': true,
          'dapp2.com': true,
        },
      },
      engine: {
        backgroundState: {
          PreferencesController: {
            selectedAddress: '0xABC',
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(Object.keys(newState.engine.backgroundState.PermissionController.subjects)).toHaveLength(2);
  });
});
