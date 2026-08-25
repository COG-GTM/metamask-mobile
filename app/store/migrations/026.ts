import { captureException } from '@sentry/react-native';
import { isObject } from '@metamask/utils';

/**
 * Subset of the persisted state read and written by this migration.
 */
interface MigrationState {
  engine: {
    backgroundState: {
      KeyringController: unknown;
      PhishingController?: {
        listState?: unknown;
        hotlistLastFetched?: number;
        stalelistLastFetched?: number;
        [key: string]: unknown;
      };
    };
  };
}

/**
 * This migration is to free space of unused data in the user devices
 * regarding the phishing list property listState, that is no longer used
 *
 **/
export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  const keyringControllerState =
    migratedState.engine.backgroundState.KeyringController;
  if (!isObject(keyringControllerState)) {
    // We are not returning state not to stop the flow of Vault recovery
    captureException(
      new Error(
        `Migration 26: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }
  const phishingControllerState =
    migratedState.engine.backgroundState.PhishingController;
  if (phishingControllerState?.listState) {
    delete phishingControllerState.listState;
  } else {
    captureException(
      new Error(
        `Migration 26: Invalid PhishingControllerState controller state: '${JSON.stringify(
          migratedState.engine.backgroundState.PhishingController,
        )}'`,
      ),
    );
  }

  if (
    phishingControllerState?.hotlistLastFetched &&
    phishingControllerState?.stalelistLastFetched
  ) {
    // This will make the list be fetched again when the user updates the app
    phishingControllerState.hotlistLastFetched = 0;
    phishingControllerState.stalelistLastFetched = 0;
  } else {
    captureException(
      new Error(
        `Migration 26: Invalid PhishingControllerState hotlist and stale list fetched: '${JSON.stringify(
          migratedState.engine.backgroundState.PhishingController,
        )}'`,
      ),
    );
  }

  return migratedState;
}
