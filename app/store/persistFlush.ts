import { AppState, AppStateStatus } from 'react-native';
import { AnyAction, Middleware } from 'redux';
import { Persistor } from 'redux-persist';
import { UserActionType } from '../actions/user/types';
import Logger from '../util/Logger';
import { flushStorageWrite } from './persistConfig';

/**
 * Actions after which the persisted state is written to disk right away
 * instead of waiting for the persist throttle / storage debounce.
 */
export const FLUSH_PERSIST_ACTIONS: string[] = [
  UserActionType.LOCKED_APP,
  UserActionType.LOGOUT,
];

/**
 * Creates a function that processes any keys queued by the redux-persist
 * throttle and then performs the pending debounced storage write.
 */
export const createFlushPersistedState =
  (getPersistor: () => Persistor | undefined) => async () => {
    const persistor = getPersistor();
    if (!persistor) return;
    try {
      await persistor.flush();
      await flushStorageWrite();
    } catch (error) {
      Logger.error(error as Error, {
        message: 'Failed to flush persisted state',
      });
    }
  };

export const createPersistFlushMiddleware =
  (flush: () => Promise<void>): Middleware =>
  () =>
  (next) =>
  (action: AnyAction) => {
    const result = next(action);
    if (action && FLUSH_PERSIST_ACTIONS.includes(action.type)) {
      flush();
    }
    return result;
  };

/**
 * Flushes the persisted state whenever the app leaves the foreground, so the
 * latest state is on disk before the OS can suspend or kill the process.
 */
export const flushPersistedStateOnAppBackground = (
  flush: () => Promise<void>,
) =>
  AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      flush();
    }
  });
