import { captureException } from '@sentry/react-native';
import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): unknown {
  const s = state as Record<string, unknown>;
  const engineState = s.engine as Record<string, unknown>;
  const backgroundState = engineState?.backgroundState as Record<
    string,
    unknown
  >;

  const keyringControllerState = backgroundState?.KeyringController;
  if (!isObject(keyringControllerState)) {
    captureException(
      new Error(
        `Migration 26: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }
  const phishingControllerState = backgroundState?.PhishingController as
    | Record<string, unknown>
    | undefined;
  if (phishingControllerState?.listState) {
    delete (backgroundState.PhishingController as Record<string, unknown>)
      .listState;
  } else {
    captureException(
      new Error(
        `Migration 26: Invalid PhishingControllerState controller state: '${JSON.stringify(
          backgroundState?.PhishingController,
        )}'`,
      ),
    );
  }

  if (
    phishingControllerState?.hotlistLastFetched &&
    phishingControllerState?.stalelistLastFetched
  ) {
    (backgroundState.PhishingController as Record<string, unknown>).hotlistLastFetched = 0;
    (backgroundState.PhishingController as Record<string, unknown>).stalelistLastFetched = 0;
  } else {
    captureException(
      new Error(
        `Migration 26: Invalid PhishingControllerState hotlist and stale list fetched: '${JSON.stringify(
          backgroundState?.PhishingController,
        )}'`,
      ),
    );
  }

  return state;
}
