import { captureException } from '@sentry/react-native';
import { isObject } from '@metamask/utils';

interface Migration26State {
  engine: {
    backgroundState: {
      KeyringController?: unknown;
      PhishingController: {
        listState?: unknown;
        hotlistLastFetched?: unknown;
        stalelistLastFetched?: unknown;
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
  const typedState = state as Migration26State;
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
    delete typedState.engine.backgroundState.PhishingController.listState;
  } else {
    captureException(
      new Error(
        `Migration 26: Invalid PhishingControllerState controller state: '${JSON.stringify(
          typedState.engine.backgroundState.PhishingController,
        )}'`,
      ),
    );
  }

  if (
    phishingControllerState?.hotlistLastFetched &&
    phishingControllerState?.stalelistLastFetched
  ) {
    // This will make the list be fetched again when the user updates the app
    typedState.engine.backgroundState.PhishingController.hotlistLastFetched = 0;
    typedState.engine.backgroundState.PhishingController.stalelistLastFetched = 0;
  } else {
    captureException(
      new Error(
        `Migration 26: Invalid PhishingControllerState hotlist and stale list fetched: '${JSON.stringify(
          typedState.engine.backgroundState.PhishingController,
        )}'`,
      ),
    );
  }

  return typedState;
}
