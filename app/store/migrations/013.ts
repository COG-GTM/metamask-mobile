import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { v1 as random } from 'uuid';

export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState) ||
    !isObject(state.engine.backgroundState.PreferencesController) ||
    !isObject(state.privacy)
  ) {
    captureException(
      new Error(`Migration 13: Invalid state structure for migration`),
    );
    return state;
  }

  // If for some reason we already have PermissionController state, bail out.
  const permissionController = state.engine.backgroundState
    .PermissionController as { subjects?: unknown } | undefined;
  const hasPermissionControllerState = Boolean(permissionController?.subjects);
  if (hasPermissionControllerState) return state;

  const privacy = state.privacy as { approvedHosts: Record<string, unknown> };
  const preferences = state.engine.backgroundState.PreferencesController as {
    selectedAddress: string;
  };

  const { approvedHosts } = privacy;
  const { selectedAddress } = preferences;

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

  const newState = { ...state } as typeof state;

  (newState.engine as { backgroundState: Record<string, unknown> }).backgroundState.PermissionController =
    {
      subjects,
    };
  return newState;
}
