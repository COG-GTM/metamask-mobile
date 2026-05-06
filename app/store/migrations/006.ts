import { isObject, hasProperty } from '@metamask/utils';
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
    return state;
  }
  const analyticsEnabled =
    hasProperty(state, 'analytics') &&
    isObject(state.analytics) &&
    state.analytics.enabled;
  analyticsEnabled
    ? DefaultPreference.set(METRICS_OPT_IN, AGREED)
    : DefaultPreference.set(METRICS_OPT_IN, DENIED);
  DefaultPreference.set(ONBOARDING_WIZARD, EXPLORED);

  return state;
}
