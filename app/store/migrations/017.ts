import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 17: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (
    isObject(state.networkOnboarded) &&
    (state.networkOnboarded as Record<string, unknown>).networkOnboardedState
  ) {
    (state.networkOnboarded as Record<string, unknown>).networkOnboardedState =
      {};
  }
  return state;
}
