import { v1 as random } from 'uuid';
import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

interface AccountPermissionSubject {
  origin: string;
  permissions: {
    eth_accounts: {
      id: string;
      parentCapability: string;
      invoker: string;
      caveats: {
        type: string;
        value: { address: unknown; lastUsed: number }[];
      }[];
      date: number;
    };
  };
}

/**
 * Migrate approved hosts to PermissionController subjects.
 * @param {unknown} state - Redux state.
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
        `Migration 13: Invalid root engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }
  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 13: Invalid root engine backgroundState: '${typeof state
          .engine.backgroundState}'`,
      ),
    );
    return state;
  }
  const { backgroundState } = state.engine;
  const permissionController = backgroundState.PermissionController;
  if (isObject(permissionController) && permissionController.subjects) {
    return state;
  }

  const privacy = state.privacy;
  if (!isObject(privacy) || !isObject(privacy.approvedHosts)) {
    captureException(
      new Error(
        `Migration 13: Invalid privacy approvedHosts state: '${typeof privacy}'`,
      ),
    );
    return state;
  }
  if (!isObject(backgroundState.PreferencesController)) {
    captureException(
      new Error(
        `Migration 13: Invalid PreferencesController state: '${typeof backgroundState.PreferencesController}'`,
      ),
    );
    return state;
  }
  const { approvedHosts } = privacy;
  const { selectedAddress } = backgroundState.PreferencesController;

  const hosts = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return state;

  const { subjects } = hosts.reduce<{
    subjects: Record<string, AccountPermissionSubject>;
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

  backgroundState.PermissionController = {
    subjects,
  };
  return { ...state };
}
