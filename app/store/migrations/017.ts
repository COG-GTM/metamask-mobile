import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 17: Invalid root state: root state is not an object`),
    );
    return state;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedState = state as Record<string, any>;
  if (typedState.networkOnboarded && typedState.networkOnboarded.networkOnboardedState) {
    typedState.networkOnboarded.networkOnboardedState = {};
  }
  return typedState;
}
