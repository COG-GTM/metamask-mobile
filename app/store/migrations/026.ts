import { captureException } from '@sentry/react-native';
import { isObject } from '@metamask/utils';

/**
 * This migration is to free space of unused data in the user devices
 * regarding the phishing list property listState, that is no longer used
 *
 **/
export default function migrate(state: unknown) {
  const typedState = state as {
    engine: {
      backgroundState: {
        KeyringController: unknown;
        PhishingController?: {
          listState?: unknown;
          hotlistLastFetched?: unknown;
          stalelistLastFetched?: unknown;
        };
      };
    };
  };
  const keyringControllerState =
    typedState.engine.backgroundState.KeyringController;
  if (!isObject(keyringControllerState)) {
    captureException(
      new Error(
        `Migration 26: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }
  const phishingControllerState =
    typedState.engine.backgroundState.PhishingController;
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
