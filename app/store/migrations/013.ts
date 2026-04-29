import { v1 as random } from 'uuid';

export default function migrate(state: Record<string, unknown>) {
  const engineState = state.engine as Record<string, Record<string, Record<string, unknown>>>;
  // If for some reason we already have PermissionController state, bail out.
  const hasPermissionControllerState = Boolean(
    (engineState.backgroundState.PermissionController as Record<string, unknown> | undefined)?.subjects,
  );
  if (hasPermissionControllerState) return state;

  const { approvedHosts } = state.privacy as { approvedHosts: Record<string, boolean> };
  const { selectedAddress } =
    engineState.backgroundState.PreferencesController as { selectedAddress: string };

  const hosts = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return state;

  const { subjects } = hosts.reduce(
    (accumulator, host, index) => ({
      subjects: {
        ...(accumulator as Record<string, unknown>).subjects,
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
    {} as Record<string, unknown>,
  ) as { subjects: Record<string, unknown> };

  const newState = { ...state };

  (newState.engine as Record<string, Record<string, Record<string, unknown>>>).backgroundState.PermissionController = {
    subjects,
  };
  return newState;
}
