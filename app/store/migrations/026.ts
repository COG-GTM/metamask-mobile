import { captureException } from '@sentry/react-native';
import { isObject } from '@metamask/utils';

/**
 * This migration is to free space of unused data in the user devices
 * regarding the phishing list property listState, that is no longer used
 *
 **/
export default function migrate(state: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as Record<string, any>;
  const keyringControllerState = s.engine.backgroundState.KeyringController;
  if (!isObject(keyringControllerState)) {
    captureException(
      new Error(
        `Migration 26: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }
  const phishingControllerState =
    s.engine.backgroundState.PhishingController;
  if (phishingControllerState?.listState) {
    delete s.engine.backgroundState.PhishingController.listState;
  } else {
    captureException(
      new Error(
        `Migration 26: Invalid PhishingControllerState controller state: '${JSON.stringify(
          s.engine.backgroundState.PhishingController,
        )}'`,
      ),
    );
  }

  if (
    phishingControllerState?.hotlistLastFetched &&
    phishingControllerState?.stalelistLastFetched
  ) {
    // This will make the list be fetched again when the user updates the app
    s.engine.backgroundState.PhishingController.hotlistLastFetched = 0;
    s.engine.backgroundState.PhishingController.stalelistLastFetched = 0;
  } else {
    captureException(
      new Error(
        `Migration 26: Invalid PhishingControllerState hotlist and stale list fetched: '${JSON.stringify(
          s.engine.backgroundState.PhishingController,
        )}'`,
      ),
    );
  }

  return s;
}
