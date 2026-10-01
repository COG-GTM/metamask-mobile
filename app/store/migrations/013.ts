import { v1 as random } from 'uuid';
import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown): Record<string, unknown> {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 013: Invalid root state: '${typeof state}'`),
    );
    return state as Record<string, unknown>;
  }

  if (
    !isObject(state.engine) ||
    !isObject((state.engine as Record<string, unknown>).backgroundState)
  ) {
    return state as Record<string, unknown>;
  }

  const engine = state.engine as Record<string, unknown>;
  const backgroundState = engine.backgroundState as Record<string, unknown>;

  // If for some reason we already have PermissionController state, bail out.
  const hasPermissionControllerState = Boolean(
    isObject(backgroundState.PermissionController) &&
    (backgroundState.PermissionController as Record<string, unknown>).subjects,
  );
  if (hasPermissionControllerState) return state as Record<string, unknown>;

  if (!isObject(state.privacy)) {
    return state as Record<string, unknown>;
  }

  const privacy = state.privacy as Record<string, unknown>;
  const approvedHosts = privacy.approvedHosts as Record<string, unknown> | undefined;
  if (!approvedHosts) return state as Record<string, unknown>;

  if (!isObject(backgroundState.PreferencesController)) {
    return state as Record<string, unknown>;
  }

  const preferencesController = backgroundState.PreferencesController as Record<string, unknown>;
  const selectedAddress = preferencesController.selectedAddress as string;

  const hosts = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return state as Record<string, unknown>;

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
    {} as { subjects: Record<string, unknown> },
  );

  const newState = { ...state } as Record<string, unknown>;

  (
    (newState.engine as Record<string, unknown>).backgroundState as Record<string, unknown>
  ).PermissionController = {
    subjects,
  };
  return newState;
}
