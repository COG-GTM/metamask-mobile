import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 016: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (
    !isObject(state.engine) ||
    !isObject(
      (state.engine as Record<string, unknown>).backgroundState,
    )
  ) {
    captureException(
      new Error(`Migration 016: Invalid engine or backgroundState`),
    );
    return state;
  }

  const backgroundState = (state.engine as Record<string, unknown>)
    .backgroundState as Record<string, unknown>;

  if (!isObject(backgroundState.NetworkController)) {
    captureException(
      new Error(`Migration 016: Invalid NetworkController state`),
    );
    return state;
  }

  const networkController = backgroundState.NetworkController as Record<
    string,
    unknown
  >;

  if (networkController.properties) {
    networkController.networkDetails = networkController.properties;
    delete networkController.properties;
  }
  return state;
}
