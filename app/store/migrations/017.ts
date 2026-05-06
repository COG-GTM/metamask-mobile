import { isObject, hasProperty } from '@metamask/utils';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }
  if (
    hasProperty(state, 'networkOnboarded') &&
    isObject(state.networkOnboarded) &&
    hasProperty(state.networkOnboarded, 'networkOnboardedState')
  ) {
    state.networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
