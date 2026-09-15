import { v1 as random } from 'uuid';
import { hasProperty, isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { ensureValidState } from './util';

interface EthAccountsCaveatValue {
  address: unknown;
  lastUsed: number;
}

interface EthAccountsPermission {
  id: string;
  parentCapability: 'eth_accounts';
  invoker: string;
  caveats: {
    type: 'restrictReturnedAccounts';
    value: EthAccountsCaveatValue[];
  }[];
  date: number;
}

interface PermissionSubject {
  origin: string;
  permissions: { eth_accounts: EthAccountsPermission };
}

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 13)) {
    return state;
  }

  // If for some reason we already have PermissionController state, bail out.
  const permissionControllerState =
    state.engine.backgroundState.PermissionController;
  const hasPermissionControllerState =
    isObject(permissionControllerState) &&
    Boolean(permissionControllerState.subjects);
  if (hasPermissionControllerState) return state;

  const privacyState: unknown = hasProperty(state, 'privacy')
    ? state.privacy
    : undefined;
  if (!isObject(privacyState) || !isObject(privacyState.approvedHosts)) {
    captureException(
      new Error(
        `Migration 13: Invalid privacy state: '${typeof privacyState}'`,
      ),
    );
    return state;
  }
  const preferencesControllerState =
    state.engine.backgroundState.PreferencesController;
  if (!isObject(preferencesControllerState)) {
    captureException(
      new Error(
        `Migration 13: Invalid PreferencesController state: '${typeof preferencesControllerState}'`,
      ),
    );
    return state;
  }

  const { approvedHosts } = privacyState;
  const { selectedAddress } = preferencesControllerState;

  const hosts = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return state;

  const subjects = hosts.reduce<Record<string, PermissionSubject>>(
    (accumulator, host, index) => ({
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

  const newState = { ...state };

  newState.engine.backgroundState.PermissionController = {
    subjects,
  };
  return newState;
}
