import { isObject } from '@metamask/utils';
import { v1 as random } from 'uuid';

interface Permission {
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
}

interface Subject {
  origin: string;
  permissions: {
    eth_accounts: Permission;
  };
}

interface Subjects {
  [key: string]: Subject;
}

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  const engineState = state.engine as Record<string, Record<string, unknown>> | undefined;
  if (!engineState?.backgroundState) {
    return state;
  }

  // If for some reason we already have PermissionController state, bail out.
  const permissionController = engineState.backgroundState.PermissionController as Record<string, unknown> | undefined;
  const hasPermissionControllerState = Boolean(permissionController?.subjects);
  if (hasPermissionControllerState) return state;

  const privacy = (state as Record<string, unknown>).privacy as Record<string, unknown> | undefined;
  if (!privacy?.approvedHosts) {
    return state;
  }

  const approvedHosts = privacy.approvedHosts as Record<string, unknown>;
  const preferencesController = engineState.backgroundState.PreferencesController as Record<string, unknown> | undefined;
  const selectedAddress = preferencesController?.selectedAddress as string | undefined;

  const hosts = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return state;

  const { subjects } = hosts.reduce<{ subjects: Subjects }>(
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
                      address: selectedAddress || '',
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
  const newEngineState = newState.engine as Record<string, Record<string, unknown>>;

  newEngineState.backgroundState.PermissionController = {
    subjects,
  };

  return newState;
}
