import { isObject } from '@metamask/utils';
import { v1 as random } from 'uuid';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) return state;
  if (!isObject(state.engine)) return state;
  if (!isObject(state.engine.backgroundState)) return state;

  const bgState = state.engine.backgroundState;

  // If for some reason we already have PermissionController state, bail out.
  const permissionController = bgState.PermissionController as Record<string, unknown> | undefined;
  const hasPermissionControllerState = Boolean(
    permissionController?.subjects,
  );
  if (hasPermissionControllerState) return state;

  const privacy = state.privacy as Record<string, unknown> | undefined;
  if (!isObject(privacy)) return state;

  const approvedHosts = privacy.approvedHosts as Record<string, unknown> | undefined;
  if (!isObject(approvedHosts)) return state;

  const preferencesController = bgState.PreferencesController as Record<string, unknown> | undefined;
  if (!isObject(preferencesController)) return state;

  const selectedAddress = preferencesController.selectedAddress as string;

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

  const newState = { ...state };

  (newState.engine as Record<string, unknown>).backgroundState = {
    ...(newState.engine as Record<string, Record<string, unknown>>).backgroundState,
    PermissionController: {
      subjects,
    },
  };
  return newState;
}
