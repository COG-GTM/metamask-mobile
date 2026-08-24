import { captureException } from '@sentry/react-native';
import { isObject } from '@metamask/utils';

interface Migration026PhishingController {
  listState?: unknown;
  hotlistLastFetched?: number;
  stalelistLastFetched?: number;
  [key: string]: unknown;
}

interface Migration026State {
  engine: {
    backgroundState: {
      KeyringController?: unknown;
      PhishingController?: Migration026PhishingController;
    };
  };
}

/**
 * This migration is to free space of unused data in the user devices
 * regarding the phishing list property listState, that is no longer used
 *
 **/
export default function migrate(state: unknown) {
  const migratedState = state as Migration026State;
  const keyringControllerState =
    migratedState.engine.backgroundState.KeyringController;
  if (!isObject(keyringControllerState)) {
    captureException(
      // We are not returning state not to stop the flow of Vault recovery
      new Error(
        `Migration 26: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }
  const phishingControllerState =
    migratedState.engine.backgroundState.PhishingController;
  if (phishingControllerState?.listState) {
    delete (
      migratedState.engine.backgroundState
        .PhishingController as Migration026PhishingController
    ).listState;
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
    (
      migratedState.engine.backgroundState
        .PhishingController as Migration026PhishingController
    ).hotlistLastFetched = 0;
    (
      migratedState.engine.backgroundState
        .PhishingController as Migration026PhishingController
    ).stalelistLastFetched = 0;
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
