import { isObject } from '@metamask/utils';
import DefaultPreference from 'react-native-default-preference';
import {
  ONBOARDING_WIZARD,
  METRICS_OPT_IN,
  AGREED,
  DENIED,
  EXPLORED,
} from '../../constants/storage';

interface AnalyticsState {
  enabled?: boolean;
}

export default function migrate(state: unknown) {
  const analytics = isObject(state)
    ? (state.analytics as AnalyticsState | undefined)
    : undefined;
  analytics?.enabled
    ? DefaultPreference.set(METRICS_OPT_IN, AGREED)
    : DefaultPreference.set(METRICS_OPT_IN, DENIED);
  DefaultPreference.set(ONBOARDING_WIZARD, EXPLORED);

  return state;
}
