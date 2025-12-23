import { v1 as random } from 'uuid';

interface Subject {
  origin: string;
  permissions: {
    eth_accounts: {
      id: string;
      parentCapability: string;
      invoker: string;
      caveats: Array<{
        type: string;
        value: Array<{
          address: string;
          lastUsed: number;
        }>;
      }>;
      date: number;
    };
  };
}

interface State {
  privacy: {
    approvedHosts: Record<string, boolean>;
  };
  engine: {
    backgroundState: {
      PreferencesController: {
        selectedAddress: string;
      };
      PermissionController?: {
        subjects?: Record<string, Subject>;
      };
    };
  };
}

export default function migrate(state: State): State {
  // If for some reason we already have PermissionController state, bail out.
  const hasPermissionControllerState = Boolean(
    state.engine.backgroundState.PermissionController?.subjects,
  );
  if (hasPermissionControllerState) return state;

  const { approvedHosts } = state.privacy;
  const { selectedAddress } =
    state.engine.backgroundState.PreferencesController;

  const hosts = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return state;

  const { subjects } = hosts.reduce<{ subjects: Record<string, Subject> }>(
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

  const newState = { ...state };

  newState.engine.backgroundState.PermissionController = {
    subjects,
  };
  return newState;
}
