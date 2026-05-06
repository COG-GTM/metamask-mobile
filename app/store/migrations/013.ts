import { isObject, hasProperty } from '@metamask/utils';
import { v1 as random } from 'uuid';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }
  if (!isObject(state.engine) || !isObject(state.engine.backgroundState)) {
    return state;
  }
  // If for some reason we already have PermissionController state, bail out.
  const permissionController =
    state.engine.backgroundState.PermissionController;
  const hasPermissionControllerState = Boolean(
    isObject(permissionController) &&
      hasProperty(permissionController, 'subjects') &&
      permissionController.subjects,
  );
  if (hasPermissionControllerState) return state;

  if (
    !isObject(state.privacy) ||
    !hasProperty(state.privacy, 'approvedHosts') ||
    !isObject(state.privacy.approvedHosts)
  ) {
    return state;
  }
  const approvedHosts = state.privacy.approvedHosts as Record<string, unknown>;
  const preferencesController =
    state.engine.backgroundState.PreferencesController;
  const selectedAddress =
    isObject(preferencesController) &&
    hasProperty(preferencesController, 'selectedAddress')
      ? (preferencesController.selectedAddress as string | undefined)
      : undefined;

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

  if (isObject(newState.engine) && isObject(newState.engine.backgroundState)) {
    newState.engine.backgroundState.PermissionController = {
      subjects,
    };
  }
  return newState;
}
