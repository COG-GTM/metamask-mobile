import { v1 as random } from 'uuid';

interface MigrationState {
  engine: {
    backgroundState: {
      PermissionController?: {
        subjects?: unknown;
      };
      PreferencesController: {
        selectedAddress: string;
        [key: string]: unknown;
      };
    };
  };
  privacy: {
    approvedHosts: Record<string, boolean>;
  };
}

export default function migrate(state: unknown): unknown {
  const s = state as MigrationState;
  const hasPermissionControllerState = Boolean(
    s.engine.backgroundState.PermissionController?.subjects,
  );
  if (hasPermissionControllerState) return state;

  const { approvedHosts } = s.privacy;
  const { selectedAddress } =
    s.engine.backgroundState.PreferencesController;

  const hosts = Object.keys(approvedHosts);
  if (hosts.length < 1) return state;

  const { subjects } = hosts.reduce<{ subjects: Record<string, unknown> }>(
    (accumulator, host, index) => ({
      subjects: {
        ...accumulator.subjects,
        [host]: {
          origin: host,
          permissions: {
            eth_accounts: {
              id: random(),
              parentCapability: 'eth_accounts',
              invoker: host,
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: [
                    {
                      address: selectedAddress,
                      lastUsed: Date.now() - index,
                    },
                  ],
                },
              ],
              date: Date.now(),
            },
          },
        },
      },
    }),
    { subjects: {} },
  );

  const newState = { ...s };

  newState.engine.backgroundState.PermissionController = {
    subjects,
  };
  return newState;
}
