import { v1 as random } from 'uuid';

interface PermissionSubject {
  origin: string;
  permissions: Record<string, unknown>;
}

interface Migration013State {
  engine: {
    backgroundState: {
      PermissionController?: {
        subjects?: Record<string, PermissionSubject>;
      };
      PreferencesController: {
        selectedAddress?: string;
      };
    };
  };
  privacy: {
    approvedHosts: Record<string, unknown>;
  };
}

export default function migrate(incomingState: unknown) {
  const state = incomingState as Migration013State;
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

  const newState = { ...state };

  newState.engine.backgroundState.PermissionController = {
    subjects,
  };
  return newState;
}
