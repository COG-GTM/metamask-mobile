import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) return state;
  if (state.recents) {
    delete state.recents;
  }
  return state;
}
