import { captureException } from '@sentry/react-native';
import { isObject } from '@metamask/utils';

interface PhishingControllerState {
  listState?: unknown;
  hotlistLastFetched?: number;
  stalelistLastFetched?: number;
}

/**
 * Shape of the persisted state this migration expects. The keyring controller
 * state is validated at runtime below before being used.
 */
interface MigrationState {
  engine: {
    backgroundState: {
      KeyringController: unknown;
      PhishingController?: PhishingControllerState;
    };
  };
}

/**
 * This migration is to free space of unused data in the user devices
 * regarding the phishing list property listState, that is no longer used
 *
 **/
export default function migrate(state: unknown): Record<string, unknown> {
  const backgroundState = (state as MigrationState).engine.backgroundState;
  const keyringControllerState = backgroundState.KeyringController;
  if (!isObject(keyringControllerState)) {
    captureException(
      new Error(
        `Migration 26: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }
  const phishingControllerState = backgroundState.PhishingController;
  if (phishingControllerState?.listState) {
    delete phishingControllerState.listState;
  } else {
    captureException(
      new Error(
        `Migration 26: Invalid PhishingControllerState controller state: '${JSON.stringify(
          backgroundState.PhishingController,
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
          backgroundState.PhishingController,
        )}'`,
      ),
    );
  }

  return state as Record<string, unknown>;
}
