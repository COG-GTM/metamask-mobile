import type { MigrationState } from './migration-types';
import DefaultPreference from 'react-native-default-preference';
import {
  ONBOARDING_WIZARD,
  METRICS_OPT_IN,
  AGREED,
  DENIED,
  EXPLORED,
} from '../../constants/storage';

export default function migrate(stateArg: unknown): unknown {
  const state = stateArg as MigrationState;
  state.analytics?.enabled
    ? DefaultPreference.set(METRICS_OPT_IN, AGREED)
    : DefaultPreference.set(METRICS_OPT_IN, DENIED);
  DefaultPreference.set(ONBOARDING_WIZARD, EXPLORED);

  return state;
}
