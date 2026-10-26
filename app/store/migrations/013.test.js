import migrate from './013';

jest.mock('uuid', () => ({ v1: () => 'mock-id' }));

describe('Migration #013', () => {
  it('returns state unchanged when PermissionController subjects exist', () => {
    const state = {
      engine: {
        backgroundState: { PermissionController: { subjects: { a: {} } } },
      },
    };
    expect(migrate(state)).toBe(state);
  });

  it('returns state unchanged when there are no approved hosts', () => {
    const state = {
      privacy: { approvedHosts: {} },
      engine: {
        backgroundState: { PreferencesController: { selectedAddress: '0x1' } },
      },
    };
    expect(migrate(state)).toBe(state);
    expect(state.engine.backgroundState.PermissionController).toBeUndefined();
  });

  it('converts approved hosts into eth_accounts permissions', () => {
    const state = {
      privacy: { approvedHosts: { 'a.com': true, 'b.com': true } },
      engine: {
        backgroundState: { PreferencesController: { selectedAddress: '0x1' } },
      },
    };
    const { subjects } =
      migrate(state).engine.backgroundState.PermissionController;
    expect(Object.keys(subjects)).toEqual(['a.com', 'b.com']);
    const permission = subjects['b.com'].permissions.eth_accounts;
    expect(subjects['b.com'].origin).toBe('b.com');
    expect(permission).toMatchObject({
      id: 'mock-id',
      parentCapability: 'eth_accounts',
      invoker: 'b.com',
    });
    expect(permission.caveats[0].type).toBe('restrictReturnedAccounts');
    expect(permission.caveats[0].value[0].address).toBe('0x1');
  });
});
