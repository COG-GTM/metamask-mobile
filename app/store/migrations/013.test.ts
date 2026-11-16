import migrate from './013';
import { v1 } from 'uuid';

jest.mock('uuid', () => ({
  v1: jest.fn(),
}));

const mockUuidV1 = v1 as jest.Mock;

const MOCK_NOW = 1700000000000;
const SELECTED_ADDRESS = '0x0123456789abcdef0123456789abcdef01234567';

interface MigrationState {
  privacy: { approvedHosts: Record<string, boolean> };
  engine: {
    backgroundState: {
      PreferencesController: { selectedAddress: string };
      PermissionController?: Record<string, unknown>;
    };
  };
}

const createState = (
  approvedHosts: Record<string, boolean>,
  PermissionController?: Record<string, unknown>,
): MigrationState => ({
  privacy: { approvedHosts },
  engine: {
    backgroundState: {
      PreferencesController: { selectedAddress: SELECTED_ADDRESS },
      ...(PermissionController ? { PermissionController } : {}),
    },
  },
});

describe('Migration #13', () => {
  beforeEach(() => {
    let counter = 0;
    mockUuidV1.mockReset();
    mockUuidV1.mockImplementation(() => `mock-uuid-${++counter}`);
    jest.spyOn(Date, 'now').mockReturnValue(MOCK_NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns state unchanged when PermissionController subjects already exist', () => {
    const existingSubjects = {
      'existing.io': {
        origin: 'existing.io',
        permissions: { eth_accounts: { id: 'keep-me' } },
      },
    };
    const oldState = createState(
      { 'legacy.io': true },
      { subjects: existingSubjects },
    );
    const snapshot = JSON.parse(JSON.stringify(oldState));

    const newState = migrate(oldState);

    expect(newState).toBe(oldState);
    expect(newState).toStrictEqual(snapshot);
    expect(newState.engine.backgroundState.PermissionController.subjects).toBe(
      existingSubjects,
    );
    expect(mockUuidV1).not.toHaveBeenCalled();
  });

  it('returns state unchanged and creates no PermissionController when approvedHosts is empty', () => {
    const oldState = createState({});
    const snapshot = JSON.parse(JSON.stringify(oldState));

    const newState = migrate(oldState);

    expect(newState).toBe(oldState);
    expect(newState).toStrictEqual(snapshot);
    expect(
      newState.engine.backgroundState.PermissionController,
    ).toBeUndefined();
    expect(mockUuidV1).not.toHaveBeenCalled();
  });

  it('grants eth_accounts for selectedAddress to each approved host', () => {
    const oldState = createState({
      'app.uniswap.org': true,
      'opensea.io': true,
    });

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.PermissionController).toStrictEqual({
      subjects: {
        'app.uniswap.org': {
          origin: 'app.uniswap.org',
          permissions: {
            eth_accounts: {
              id: 'mock-uuid-1',
              parentCapability: 'eth_accounts',
              invoker: 'app.uniswap.org',
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: [{ address: SELECTED_ADDRESS, lastUsed: MOCK_NOW }],
                },
              ],
              date: MOCK_NOW,
            },
          },
        },
        'opensea.io': {
          origin: 'opensea.io',
          permissions: {
            eth_accounts: {
              id: 'mock-uuid-2',
              parentCapability: 'eth_accounts',
              invoker: 'opensea.io',
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: [
                    { address: SELECTED_ADDRESS, lastUsed: MOCK_NOW - 1 },
                  ],
                },
              ],
              date: MOCK_NOW,
            },
          },
        },
      },
    });
    expect(mockUuidV1).toHaveBeenCalledTimes(2);
  });

  it('only grants the eth_accounts permission and leaves the rest of state intact', () => {
    const oldState = createState({ 'example.com': true });

    const newState = migrate(oldState);
    const { subjects } = newState.engine.backgroundState.PermissionController;

    expect(Object.keys(subjects)).toStrictEqual(['example.com']);
    expect(Object.keys(subjects['example.com'].permissions)).toStrictEqual([
      'eth_accounts',
    ]);
    expect(newState.privacy).toStrictEqual({
      approvedHosts: { 'example.com': true },
    });
    expect(newState.engine.backgroundState.PreferencesController).toStrictEqual(
      { selectedAddress: SELECTED_ADDRESS },
    );
  });

  it('migrates hosts when PermissionController exists without subjects', () => {
    const oldState = createState({ 'example.com': true }, {});

    const newState = migrate(oldState);

    expect(
      Object.keys(
        newState.engine.backgroundState.PermissionController.subjects,
      ),
    ).toStrictEqual(['example.com']);
  });
});
