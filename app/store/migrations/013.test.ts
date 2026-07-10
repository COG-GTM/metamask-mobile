import migrate from './013';

describe('Migration #13', () => {
  it('should return state unaltered if no dapps are connected', () => {
    const oldState = {
      privacy: { approvedHosts: {} },
      engine: {
        backgroundState: {
          PreferencesController: { selectedAddress: '0x1' },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual(oldState);
  });

  it('should create permission controller subjects from approved hosts', () => {
    const oldState = {
      privacy: { approvedHosts: { 'example.com': true } },
      engine: {
        backgroundState: {
          PreferencesController: { selectedAddress: '0x1' },
        },
      },
    };

    const newState = migrate(oldState);
    const subjects =
      newState.engine.backgroundState.PermissionController?.subjects;

    expect(subjects).toHaveProperty(['example.com']);
    const subject = (
      subjects as Record<
        string,
        {
          origin: string;
          permissions: {
            eth_accounts: { parentCapability: string; invoker: string };
          };
        }
      >
    )['example.com'];
    expect(subject.origin).toBe('example.com');
    expect(subject.permissions.eth_accounts.parentCapability).toBe(
      'eth_accounts',
    );
    expect(subject.permissions.eth_accounts.invoker).toBe('example.com');
  });
});
