import { hasProperty, isObject } from '@metamask/utils';
import { v1 as random } from 'uuid';
import { ensureValidState } from './util';

interface PermissionSubjects {
  [origin: string]: {
    origin: string;
    permissions: Record<string, unknown>;
  };
}

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 13)) {
    return state;
  }

  const permissionControllerState =
    state.engine.backgroundState.PermissionController;

  // If for some reason we already have PermissionController state, bail out.
  const hasPermissionControllerState = Boolean(
    isObject(permissionControllerState) && permissionControllerState.subjects,
  );
  if (hasPermissionControllerState) return state;

  const preferencesControllerState =
    state.engine.backgroundState.PreferencesController;

  const privacyState = hasProperty(state, 'privacy')
    ? state.privacy
    : undefined;

  if (!isObject(privacyState) || !isObject(preferencesControllerState)) {
    return state;
  }

  const { approvedHosts } = privacyState;
  const { selectedAddress } = preferencesControllerState;

  if (!isObject(approvedHosts)) {
    return state;
  }

  const hosts = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return state;

  const subjects = hosts.reduce(
    (accumulator: PermissionSubjects, host, index) => ({
      ...accumulator,
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
    }),
    {},
  );

  state.engine.backgroundState.PermissionController = {
    subjects,
  };
  return state;
}
