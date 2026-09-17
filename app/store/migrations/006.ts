import DefaultPreference from 'react-native-default-preference';
import {
  ONBOARDING_WIZARD,
  METRICS_OPT_IN,
  AGREED,
  DENIED,
  EXPLORED,
} from '../../constants/storage';

// Legacy persisted state shape expected by this migration
interface StateWithAnalytics {
  analytics?: {
    enabled?: boolean;
  };
}

export default function migrate(state: unknown) {
  const typedState = state as StateWithAnalytics;
  typedState.analytics?.enabled
    ? DefaultPreference.set(METRICS_OPT_IN, AGREED)
    : DefaultPreference.set(METRICS_OPT_IN, DENIED);
  DefaultPreference.set(ONBOARDING_WIZARD, EXPLORED);

  return typedState;
}
