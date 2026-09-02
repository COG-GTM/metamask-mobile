import { v1 as random } from 'uuid';

interface PermissionSubject {
  origin: string;
  permissions: {
    eth_accounts: {
      id: string;
      parentCapability: string;
      invoker: string;
      caveats: {
        type: string;
        value: { address: unknown; lastUsed: number }[];
      }[];
      date: number;
    };
  };
}

interface Migration013State {
  privacy: {
    approvedHosts: Record<string, unknown>;
  };
  engine: {
    backgroundState: {
      PermissionController?: {
        subjects?: Record<string, PermissionSubject>;
      };
      PreferencesController: {
        selectedAddress: unknown;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as Migration013State;
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

  const { subjects } = hosts.reduce<{
    subjects?: Record<string, PermissionSubject>;
  }>(
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

  const newState = { ...migratedState };

  newState.engine.backgroundState.PermissionController = {
    subjects,
  };
  return newState;
}
