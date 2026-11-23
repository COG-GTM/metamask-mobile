import { v1 as random } from 'uuid';

interface Subject {
  origin: string;
  permissions: Record<string, unknown>;
}

interface MigrationState {
  privacy: { approvedHosts: Record<string, unknown> };
  engine: {
    backgroundState: {
      PermissionController?: { subjects?: Record<string, Subject> };
      PreferencesController: { selectedAddress?: string };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as MigrationState;
  // If for some reason we already have PermissionController state, bail out.
  const hasPermissionControllerState = Boolean(
    typedState.engine.backgroundState.PermissionController?.subjects,
  );
  if (hasPermissionControllerState) return typedState;

  const { approvedHosts } = typedState.privacy;
  const { selectedAddress } =
    typedState.engine.backgroundState.PreferencesController;

  const hosts = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return typedState;

  const { subjects } = hosts.reduce<{ subjects?: Record<string, Subject> }>(
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
  return newState;
}
