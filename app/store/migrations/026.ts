import { captureException } from '@sentry/react-native';
import { isObject } from '@metamask/utils';

interface PhishingControllerState {
  listState?: unknown;
  hotlistLastFetched?: number;
  stalelistLastFetched?: number;
  [key: string]: unknown;
}

/**
 * This migration is to free space of unused data in the user devices
 * regarding the phishing list property listState, that is no longer used
 *
 **/
export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState)
  ) {
    captureException(
      new Error(`Migration 26: Invalid state structure`),
    );
    return state;
  }

  const keyringControllerState = state.engine.backgroundState.KeyringController;
  if (!isObject(keyringControllerState)) {
    // We are not returning state not to stop the flow of Vault recovery
    captureException(
      new Error(
        `Migration 26: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }
  const phishingControllerState = state.engine.backgroundState
    .PhishingController as PhishingControllerState | undefined;
  if (phishingControllerState?.listState) {
    delete phishingControllerState.listState;
  } else {
    captureException(
      new Error(
        `Migration 26: Invalid PhishingControllerState controller state: '${JSON.stringify(
          phishingControllerState,
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
          phishingControllerState,
        )}'`,
      ),
    );
  }

  return state;
}
