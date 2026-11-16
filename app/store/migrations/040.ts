import { captureException } from '@sentry/react-native';
import { hasProperty, isObject } from '@metamask/utils';
import { ensureValidState } from './util';

/**
 * Converts a `{ address, lastUsed }` caveat entry to its address string.
 * Entries that are already strings (or otherwise unrecognized) are kept as-is
 * so re-running the migration never drops permitted accounts.
 *
 * @param entry - A single caveat value entry.
 * @returns The address string, or the original entry.
 */
const toAddress = (entry: unknown) =>
  isObject(entry) &&
  hasProperty(entry, 'address') &&
  typeof entry.address === 'string'
    ? entry.address
    : entry;

const migrateCaveat = (caveat: unknown) => {
  if (!isObject(caveat) || !Array.isArray(caveat.value)) {
    return caveat;
  }
  return { ...caveat, value: caveat.value.map(toAddress) };
};

/**
 * Migration to remove metadata from Permissioned accounts
 *
 * @param state Persisted Redux state
 * @returns
 */
export default function migrate(state: unknown) {
  if (!ensureValidState(state, 40)) {
    return state;
  }

  const permissionControllerState =
    state.engine.backgroundState.PermissionController;

  if (!isObject(permissionControllerState)) {
    captureException(
      new Error(
        `Migration 40: Invalid PermissionController state error: '${JSON.stringify(
          permissionControllerState,
        )}'`,
      ),
    );
    return state;
  }

  if (
    hasProperty(permissionControllerState, 'subjects') &&
    isObject(permissionControllerState.subjects)
  ) {
    for (const origin in permissionControllerState.subjects) {
      const subject = permissionControllerState.subjects[origin];
      if (isObject(subject) && hasProperty(subject, 'permissions')) {
        const permissions = subject.permissions;
        if (isObject(permissions) && hasProperty(permissions, 'eth_accounts')) {
          const ethAccounts = permissions.eth_accounts;
          if (
            isObject(ethAccounts) &&
            hasProperty(ethAccounts, 'caveats') &&
            Array.isArray(ethAccounts.caveats)
          ) {
            ethAccounts.caveats = ethAccounts.caveats.map(migrateCaveat);
          }
        }
      }
    }
  }

  return state;
}
