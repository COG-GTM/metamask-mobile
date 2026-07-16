import { isObject } from '@metamask/utils';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }

  if (
    isObject(state.networkOnboarded) &&
    state.networkOnboarded.networkOnboardedState
  ) {
    state.networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
