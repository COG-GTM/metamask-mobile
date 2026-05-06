import { isObject, hasProperty } from '@metamask/utils';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }
  if (hasProperty(state, 'recents')) {
    delete state.recents;
  }
  return state;
}
