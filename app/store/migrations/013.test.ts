import migrate from './013';

describe('Migration #13', () => {
  it('returns state unchanged when PermissionController subjects exist', () => {
    const oldState = {
      privacy: { approvedHosts: { 'a.com': true } },
      engine: {
        backgroundState: {
          PermissionController: { subjects: {} },
          PreferencesController: { selectedAddress: '0x1' },
        },
      },
    };

    expect(migrate(oldState)).toStrictEqual(oldState);
  });

  it('returns state unchanged when there are no approved hosts', () => {
    const oldState = {
      privacy: { approvedHosts: {} },
      engine: {
        backgroundState: { PreferencesController: { selectedAddress: '0x1' } },
      },
    };

    expect(migrate(oldState)).toStrictEqual(oldState);
  });

  it('creates eth_accounts permissions for approved hosts', () => {
    const oldState = {
      privacy: { approvedHosts: { 'a.com': true } },
      engine: {
        backgroundState: { PreferencesController: { selectedAddress: '0x1' } },
      },
    };

    const newState = migrate(oldState);

    expect(
      newState.engine.backgroundState.PermissionController?.subjects,
    ).toStrictEqual({
      'a.com': {
        origin: 'a.com',
        permissions: {
          eth_accounts: {
            id: expect.any(String),
            parentCapability: 'eth_accounts',
            invoker: 'a.com',
            caveats: [
              {
                type: 'restrictReturnedAccounts',
                value: [{ address: '0x1', lastUsed: expect.any(Number) }],
              },
            ],
            date: expect.any(Number),
          },
        },
      },
    });
  });
});
