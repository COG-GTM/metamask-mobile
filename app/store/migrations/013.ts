import { v1 as random } from 'uuid';

interface MigrationState {
  privacy: {
    approvedHosts: Record<string, unknown>;
    [key: string]: unknown;
  };
  engine: {
    backgroundState: {
      PermissionController?: {
        subjects?: unknown;
        [key: string]: unknown;
      };
      PreferencesController: {
        selectedAddress?: unknown;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
  };
  [key: string]: unknown;
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
  // If for some reason we already have PermissionController state, bail out.
  const hasPermissionControllerState = Boolean(
    typedState.engine.backgroundState.PermissionController?.subjects,
  );
  if (hasPermissionControllerState)
    return typedState as unknown as Record<string, unknown>;

  const { approvedHosts } = typedState.privacy;
  const { selectedAddress } =
    typedState.engine.backgroundState.PreferencesController;

  const hosts = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return typedState as unknown as Record<string, unknown>;

  const { subjects } = hosts.reduce<{ subjects?: Record<string, unknown> }>(
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
    {},
  );

  const newState = { ...typedState };

  newState.engine.backgroundState.PermissionController = {
    subjects,
  };
  return newState as unknown as Record<string, unknown>;
}
