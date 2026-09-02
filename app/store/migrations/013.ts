import { v1 as random } from 'uuid';

interface PermissionSubject {
  origin: string;
  permissions: Record<string, unknown>;
}

/**
 * Subset of the persisted state read and written by this migration.
 */
interface MigrationState {
  privacy: {
    approvedHosts: Record<string, unknown>;
  };
  engine: {
    backgroundState: {
      PermissionController?: {
        subjects?: Record<string, PermissionSubject>;
      };
      PreferencesController: {
        selectedAddress: string;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  // If for some reason we already have PermissionController state, bail out.
  const hasPermissionControllerState = Boolean(
    migratedState.engine.backgroundState.PermissionController?.subjects,
  );
  if (hasPermissionControllerState) return migratedState;

  const { approvedHosts } = migratedState.privacy;
  const { selectedAddress } =
    migratedState.engine.backgroundState.PreferencesController;

  const hosts = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return migratedState;

  const { subjects } = hosts.reduce(
    (
      accumulator: { subjects?: Record<string, PermissionSubject> },
      host,
      index,
    ) => ({
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

  const newState = { ...migratedState };

  newState.engine.backgroundState.PermissionController = {
    subjects,
  };
  return newState;
}
