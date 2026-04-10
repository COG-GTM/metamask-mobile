import { v1 as random } from 'uuid';

export default function migrate(state: unknown) {
  const typedState = state as {
    privacy: {
      approvedHosts: Record<string, boolean>;
    };
    engine: {
      backgroundState: {
        PreferencesController: {
          selectedAddress: string;
        };
        PermissionController?: {
          subjects?: Record<string, unknown>;
        };
      };
    };
  };
  // If for some reason we already have PermissionController state, bail out.
  const hasPermissionControllerState = Boolean(
    typedState.engine.backgroundState.PermissionController?.subjects,
  );
  if (hasPermissionControllerState) return state;

  const { approvedHosts } = typedState.privacy;
  const { selectedAddress } =
    typedState.engine.backgroundState.PreferencesController;

  const hosts = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return state;

  const { subjects } = hosts.reduce<{
    subjects: Record<string, unknown>;
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
    { subjects: {} },
  );

  const newState = { ...typedState };

  newState.engine.backgroundState.PermissionController = {
    subjects,
  };
  return newState;
}
