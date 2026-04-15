import { captureException } from '@sentry/react-native';
import { isObject } from '@metamask/utils';








export function ensureValidState(
state,
migrationNumber)
{
  if (!isObject(state)) {
    captureException(
      new Error(
        `FATAL ERROR: Migration ${migrationNumber}: Invalid state error: '${typeof state}'`
      )
    );
    return false;
  }

  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `FATAL ERROR: Migration ${migrationNumber}: Invalid engine state error: '${typeof state.engine}'`
      )
    );
    return false;
  }

  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `FATAL ERROR: Migration ${migrationNumber}: Invalid engine backgroundState error: '${typeof state.
        engine.backgroundState}'`
      )
    );
    return false;
  }

  return true;
}