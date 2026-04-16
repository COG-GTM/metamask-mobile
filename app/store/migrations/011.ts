import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 011: Invalid root state: '${typeof state}'`),
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
      new Error(`Migration 011: Invalid engine or backgroundState`),
    );
    return state;
  }

  const backgroundState = (state.engine as Record<string, unknown>)
    .backgroundState as Record<string, unknown>;

  if (!isObject(backgroundState.PreferencesController)) {
    captureException(
      new Error(`Migration 011: Invalid PreferencesController state`),
    );
    return state;
  }

  const preferencesController =
    backgroundState.PreferencesController as Record<string, unknown>;

  backgroundState.PreferencesController = {
    ...preferencesController,
    useTokenDetection: true,
  };
  return state;
}
