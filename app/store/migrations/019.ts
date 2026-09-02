import { hasProperty, isObject } from '@metamask/utils';

export default function migrate(state: unknown) {
  if (isObject(state) && hasProperty(state, 'recents') && state.recents) {
    delete state.recents;
  }
  return state;
}
