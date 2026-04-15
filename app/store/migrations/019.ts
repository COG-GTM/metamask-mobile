import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 19: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (state.recents) {
    delete state.recents;
  }
  return state;
}
