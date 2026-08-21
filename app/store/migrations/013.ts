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
        value: { address: string; lastUsed: number }[];
      }[];
      date: number;
    };
  };
}

interface SubjectAccumulator {
  subjects: Record<string, PermissionSubject>;
}

/**
 * Shape of the persisted state this migration expects. It predates the runtime
 * validation used by later migrations, so the shape is asserted rather than
 * narrowed in order to keep the original behaviour.
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
      };
    };
  };
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
  // If for some reason we already have PermissionController state, bail out.
  const hasPermissionControllerState = Boolean(
    typedState.engine.backgroundState.PermissionController?.subjects,
  );
  if (hasPermissionControllerState) return state as Record<string, unknown>;

  const { approvedHosts } = typedState.privacy;
  const { selectedAddress } =
    typedState.engine.backgroundState.PreferencesController;

  const hosts = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return state as Record<string, unknown>;

  const { subjects } = hosts.reduce<SubjectAccumulator>(
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
    // The original implementation seeds the reducer with an empty object and
    // relies on spreading `undefined` on the first iteration.
    {} as SubjectAccumulator,
  );

  const newState = { ...typedState };

  newState.engine.backgroundState.PermissionController = {
    subjects,
  };
  return newState as unknown as Record<string, unknown>;
}
