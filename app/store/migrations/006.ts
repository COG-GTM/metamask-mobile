import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import DefaultPreference from 'react-native-default-preference';
import {
  ONBOARDING_WIZARD,
  METRICS_OPT_IN,
  AGREED,
  DENIED,
  EXPLORED,
} from '../../constants/storage';

/**
 * Persist analytics preferences and onboarding state to DefaultPreference.
 *
 * @param state - Redux state.
 * @returns Migrated Redux state.
 */
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 6: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  const analyticsState = isObject(state.analytics) ? state.analytics : undefined;
  if (analyticsState && analyticsState.enabled) {
    DefaultPreference.set(METRICS_OPT_IN, AGREED);
  } else {
    DefaultPreference.set(METRICS_OPT_IN, DENIED);
  }
  DefaultPreference.set(ONBOARDING_WIZARD, EXPLORED);

  return state;
}
