import { v1 as random } from 'uuid';

interface Caveat {
  type: string;
  value: { address: unknown; lastUsed: number }[];
}

interface EthAccountsPermission {
  id: string;
  parentCapability: string;
  invoker: string;
  caveats: Caveat[];
  date: number;
}

interface Subject {
  origin: string;
  permissions: { eth_accounts: EthAccountsPermission };
}

type Subjects = Record<string, Subject>;

interface MigrationState {
  privacy: {
    approvedHosts: Record<string, unknown>;
  };
  engine: {
    backgroundState: {
      PermissionController?: { subjects?: Subjects };
      PreferencesController: { selectedAddress?: string };
    };
  };
}

export default function migrate(state: unknown) {
  const migrationState = state as MigrationState;
  // If for some reason we already have PermissionController state, bail out.
  const hasPermissionControllerState = Boolean(
    migrationState.engine.backgroundState.PermissionController?.subjects,
  );
  if (hasPermissionControllerState) return state;

  const { approvedHosts } = migrationState.privacy;
  const { selectedAddress } =
    migrationState.engine.backgroundState.PreferencesController;

  const hosts = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return state;

  const { subjects } = hosts.reduce<{ subjects?: Subjects }>(
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

  const newState = { ...migrationState };

  newState.engine.backgroundState.PermissionController = {
    subjects,
  };
  return newState;
}
