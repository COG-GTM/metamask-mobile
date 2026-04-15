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

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 6: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  const analytics = state.analytics as Record<string, unknown> | undefined;
  analytics?.enabled
    ? DefaultPreference.set(METRICS_OPT_IN, AGREED)
    : DefaultPreference.set(METRICS_OPT_IN, DENIED);
  DefaultPreference.set(ONBOARDING_WIZARD, EXPLORED);

  return state;
}
