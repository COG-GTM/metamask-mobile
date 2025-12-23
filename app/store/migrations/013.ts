import { isObject, hasProperty } from '@metamask/utils';
import { v1 as random } from 'uuid';

interface Subject {
  origin: string;
  permissions: {
    eth_accounts: {
      id: string;
      parentCapability: string;
      invoker: string;
      caveats: Array<{
        type: string;
        value: Array<{
          address: string;
          lastUsed: number;
        }>;
      }>;
      date: number;
    };
  };
}

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  if (!isObject(state.privacy) || !hasProperty(state.privacy, 'approvedHosts')) {
    return state;
  }

  if (!isObject(state.engine)) {
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    return state;
  }

  const backgroundState = state.engine.backgroundState as Record<string, unknown>;
  const permissionController = backgroundState.PermissionController as Record<string, unknown> | undefined;
  const preferencesController = backgroundState.PreferencesController as Record<string, unknown> | undefined;

  // If for some reason we already have PermissionController state, bail out.
  const hasPermissionControllerState = Boolean(permissionController?.subjects);
  if (hasPermissionControllerState) return state;

  const approvedHosts = state.privacy.approvedHosts as Record<string, boolean>;
  const selectedAddress = preferencesController?.selectedAddress as string;

  const hosts = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return state;

  const { subjects } = hosts.reduce<{ subjects: Record<string, Subject> }>(
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

  backgroundState.PermissionController = {
    subjects,
  };
  return state;
}
