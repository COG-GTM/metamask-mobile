import { v1 as random } from 'uuid';

interface Migration13State {
  privacy: {
    approvedHosts: Record<string, unknown>;
  };
  engine: {
    backgroundState: {
      PermissionController?: {
        subjects?: unknown;
      };
      PreferencesController: {
        selectedAddress: unknown;
      };
    };
  };
}

interface SubjectsAccumulator {
  subjects: Record<string, unknown>;
}

export default function migrate(state: unknown) {
  const typedState = state as Migration13State;
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

  const { subjects } = hosts.reduce(
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
    {} as SubjectsAccumulator,
  );

  const newState = { ...typedState };

  newState.engine.backgroundState.PermissionController = {
    subjects,
  };
  return newState;
}
