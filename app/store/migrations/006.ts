import DefaultPreference from 'react-native-default-preference';
import {
  ONBOARDING_WIZARD,
  METRICS_OPT_IN,
  AGREED,
  DENIED,
  EXPLORED,
} from '../../constants/storage';

interface Migration006State {
  analytics?: {
    enabled?: boolean;
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as Migration006State;
  migratedState.analytics?.enabled
    ? DefaultPreference.set(METRICS_OPT_IN, AGREED)
    : DefaultPreference.set(METRICS_OPT_IN, DENIED);
  DefaultPreference.set(ONBOARDING_WIZARD, EXPLORED);

  return migratedState;
}
