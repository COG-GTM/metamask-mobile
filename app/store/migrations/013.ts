import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { v1 as random } from 'uuid';

interface PermissionCaveat {
  type: string;
  value: Array<{
    address: string;
    lastUsed: number;
  }>;
}

interface Permission {
  id: string;
  parentCapability: string;
  invoker: string;
  caveats: PermissionCaveat[];
  date: number;
}

interface Subject {
  origin: string;
  permissions: {
    eth_accounts: Permission;
  };
}

interface SubjectsAccumulator {
  subjects: Record<string, Subject>;
}

/**
 * Migrate approved hosts from privacy state to PermissionController subjects.
 *
 * @param state - Redux state.
 * @returns Migrated Redux state.
 */
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
  if (
    isObject(state.engine.backgroundState.PermissionController) &&
    isObject(
      (state.engine.backgroundState.PermissionController as Record<string, unknown>)
    ) &&
    (state.engine.backgroundState.PermissionController as Record<string, unknown>)
      .subjects
  ) {
    return state;
  }

  if (!isObject(state.privacy)) {
    captureException(
      new Error(`Migration 13: Invalid privacy state`),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState.PreferencesController)) {
    captureException(
      new Error(`Migration 13: Invalid PreferencesController state`),
    );
    return state;
  }

  const approvedHosts = (state.privacy as Record<string, unknown>)
    .approvedHosts as Record<string, boolean>;
  const selectedAddress = (
    state.engine.backgroundState.PreferencesController as Record<string, unknown>
  ).selectedAddress as string;

  const hosts = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return state;

  const { subjects } = hosts.reduce<SubjectsAccumulator>(
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
    (newState.engine.backgroundState as Record<string, unknown>).PermissionController = {
      subjects,
    };
  }
  return newState;
}
