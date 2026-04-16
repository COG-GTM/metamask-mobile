import { v1 as random } from 'uuid';
import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 013: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (
    !isObject(state.engine) ||
    !isObject(
      (state.engine as Record<string, unknown>).backgroundState,
    )
  ) {
    captureException(
      new Error(`Migration 013: Invalid engine or backgroundState`),
    );
    return state;
  }

  const backgroundState = (state.engine as Record<string, unknown>)
    .backgroundState as Record<string, unknown>;

  // If for some reason we already have PermissionController state, bail out.
  const permissionController = backgroundState.PermissionController as
    | Record<string, unknown>
    | undefined;
  const hasPermissionControllerState = Boolean(permissionController?.subjects);
  if (hasPermissionControllerState) return state;

  if (!isObject(state.privacy)) {
    return state;
  }

  const privacy = state.privacy as Record<string, unknown>;
  const approvedHosts = privacy.approvedHosts as Record<string, boolean>;
  if (!isObject(approvedHosts)) {
    return state;
  }

  if (!isObject(backgroundState.PreferencesController)) {
    captureException(
      new Error(`Migration 013: Invalid PreferencesController state`),
    );
    return state;
  }

  const preferencesController =
    backgroundState.PreferencesController as Record<string, unknown>;
  const selectedAddress = preferencesController.selectedAddress as string;

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

  const newState = { ...state } as Record<string, unknown>;

  (
    (newState.engine as Record<string, unknown>)
      .backgroundState as Record<string, unknown>
  ).PermissionController = {
    subjects,
  };
  return newState;
}
