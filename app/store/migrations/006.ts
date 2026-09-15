import DefaultPreference from 'react-native-default-preference';
import { isObject } from '@metamask/utils';
import {
  ONBOARDING_WIZARD,
  METRICS_OPT_IN,
  AGREED,
  DENIED,
  EXPLORED,
} from '../../constants/storage';

export default function migrate(state: unknown) {
  const analyticsEnabled =
    isObject(state) && isObject(state.analytics) && state.analytics.enabled;
  analyticsEnabled
    ? DefaultPreference.set(METRICS_OPT_IN, AGREED)
    : DefaultPreference.set(METRICS_OPT_IN, DENIED);
  DefaultPreference.set(ONBOARDING_WIZARD, EXPLORED);

  return state;
}
