import { v1 as random } from 'uuid';

export default function migrate(state: unknown): unknown {
  const s = state as {
    privacy: { approvedHosts: Record<string, boolean> };
    engine: { backgroundState: Record<string, Record<string, unknown>> };
  };
  // If for some reason we already have PermissionController state, bail out.
  const hasPermissionControllerState = Boolean(
    s.engine.backgroundState.PermissionController?.subjects,
  );
  if (hasPermissionControllerState) return state;

  const { approvedHosts } = s.privacy;
  const { selectedAddress } =
    s.engine.backgroundState.PreferencesController as { selectedAddress: string };

  const hosts = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return state;

  const { subjects } = hosts.reduce<{ subjects: Record<string, unknown> }>(
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

  const newState = { ...s };

  newState.engine.backgroundState.PermissionController = {
    subjects,
  };
  return newState;
}
