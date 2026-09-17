import { hasProperty, isObject } from '@metamask/utils';
import { v1 as random } from 'uuid';
import { ensureValidState } from './util';

interface Subjects {
  subjects: Record<string, unknown>;
}

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 13)) {
    return state;
  }

  const backgroundState = state.engine.backgroundState;
  const permissionController = backgroundState.PermissionController;

  // If for some reason we already have PermissionController state, bail out.
  const hasPermissionControllerState = Boolean(
    isObject(permissionController) && permissionController.subjects,
  );
  if (hasPermissionControllerState) return state;

  const preferencesController = backgroundState.PreferencesController;
  const privacy = hasProperty(state, 'privacy') ? state.privacy : undefined;
  if (!isObject(privacy) || !isObject(preferencesController)) {
    return state;
  }

  const { approvedHosts } = privacy;
  const { selectedAddress } = preferencesController;

  if (!isObject(approvedHosts)) {
    return state;
  }

  const hosts = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return state;

  const { subjects } = hosts.reduce<Subjects>(
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

  newState.engine.backgroundState.PermissionController = {
    subjects,
  };
  return newState;
}
