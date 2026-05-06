import { captureException } from '@sentry/react-native';
import { isObject, hasProperty } from '@metamask/utils';

/**
 * This migration is to free space of unused data in the user devices
 * regarding the phishing list property listState, that is no longer used
 *
 **/
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }
  if (!isObject(state.engine) || !isObject(state.engine.backgroundState)) {
    return state;
  }
  const keyringControllerState = state.engine.backgroundState.KeyringController;
  if (!isObject(keyringControllerState)) {
    captureException(
      new Error(
        `Migration 26: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }
  const phishingControllerState =
    state.engine.backgroundState.PhishingController;
  if (
    isObject(phishingControllerState) &&
    hasProperty(phishingControllerState, 'listState') &&
    phishingControllerState.listState
  ) {
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
    isObject(phishingControllerState) &&
    hasProperty(phishingControllerState, 'hotlistLastFetched') &&
    phishingControllerState.hotlistLastFetched &&
    hasProperty(phishingControllerState, 'stalelistLastFetched') &&
    phishingControllerState.stalelistLastFetched
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
