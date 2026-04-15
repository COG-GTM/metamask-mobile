import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { v1 as random } from 'uuid';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 13: Invalid root state: '${typeof state}'`),
    );
    return state;
  }
  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 13: Invalid engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }
  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 13: Invalid engine backgroundState: '${typeof state.engine
          .backgroundState}'`,
      ),
    );
    return state;
  }

  // If for some reason we already have PermissionController state, bail out.
  const hasPermissionControllerState = Boolean(
    isObject(state.engine.backgroundState.PermissionController) &&
      (state.engine.backgroundState.PermissionController as Record<string, unknown>).subjects,
  );
  if (hasPermissionControllerState) return state;

  if (!isObject(state.privacy)) {
    captureException(
      new Error(
        `Migration 13: Invalid privacy state: '${typeof state.privacy}'`,
      ),
    );
    return state;
  }

  const approvedHosts = state.privacy.approvedHosts as Record<string, unknown>;
  if (!isObject(state.engine.backgroundState.PreferencesController)) {
    captureException(
      new Error(
        `Migration 13: Invalid PreferencesController state: '${typeof state
          .engine.backgroundState.PreferencesController}'`,
      ),
    );
    return state;
  }
  const { selectedAddress } = state.engine.backgroundState
    .PreferencesController as { selectedAddress: string };

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

  const newState = { ...state };

  (newState.engine as Record<string, Record<string, Record<string, unknown>>>)
    .backgroundState.PermissionController = {
    subjects,
  };
  return newState;
}
