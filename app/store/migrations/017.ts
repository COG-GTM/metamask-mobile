import { isObject } from '@metamask/utils';

export default function migrate(state: unknown) {
  if (!isObject(state)) return state;
  const networkOnboarded = state.networkOnboarded as
    | { networkOnboardedState?: unknown }
    | undefined;
  if (networkOnboarded?.networkOnboardedState) {
    networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
