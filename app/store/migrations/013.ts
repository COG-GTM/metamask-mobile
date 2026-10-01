import { v1 as random } from 'uuid';

interface Subject {
  origin: string;
  permissions: Record<string, unknown>;
}

export default function migrate(state: unknown): Record<string, unknown> {
  // Expected shape: state.privacy.approvedHosts is a map of connected dapp
  // hosts; PreferencesController.selectedAddress is the active account.
  const typedState = state as {
    privacy: { approvedHosts: Record<string, unknown> };
    engine: { backgroundState: Record<string, Record<string, unknown>> };
  };
  const { backgroundState } = typedState.engine;
  // If for some reason we already have PermissionController state, bail out.
  const hasPermissionControllerState = Boolean(
    (
      backgroundState.PermissionController as
        | { subjects?: unknown }
        | undefined
    )?.subjects,
  );
  if (hasPermissionControllerState) return state as Record<string, unknown>;

  const { approvedHosts } = typedState.privacy;
  const { selectedAddress } = backgroundState.PreferencesController;

  const hosts = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return state as Record<string, unknown>;

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

  const newState = { ...typedState };

  newState.engine.backgroundState.PermissionController = {
    subjects,
  };
  return newState as unknown as Record<string, unknown>;
}
