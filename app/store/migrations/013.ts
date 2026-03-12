import { v1 as random } from 'uuid';

export default function migrate(state: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as Record<string, any>;
  // If for some reason we already have PermissionController state, bail out.
  const hasPermissionControllerState = Boolean(
    s.engine.backgroundState.PermissionController?.subjects,
  );
  if (hasPermissionControllerState) return s;

  const { approvedHosts } = s.privacy;
  const { selectedAddress } =
    s.engine.backgroundState.PreferencesController;

  const hosts = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return s;

  const { subjects } = hosts.reduce(
    (accumulator: Record<string, any>, host: string, index: number) => ({
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

  const newState = { ...s } as Record<string, any>;

  newState.engine.backgroundState.PermissionController = {
    subjects,
  };
  return newState;
}
