import DefaultPreference from 'react-native-default-preference';
import {
  ONBOARDING_WIZARD,
  METRICS_OPT_IN,
  AGREED,
  DENIED,
  EXPLORED,
} from '../../constants/storage';

interface MigrationState {
  analytics?: {
    enabled?: unknown;
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as MigrationState;
  typedState.analytics?.enabled
    ? DefaultPreference.set(METRICS_OPT_IN, AGREED)
    : DefaultPreference.set(METRICS_OPT_IN, DENIED);
  DefaultPreference.set(ONBOARDING_WIZARD, EXPLORED);

  return typedState;
}
