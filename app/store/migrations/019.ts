import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  if ((state as Record<string, unknown>).recents) {
    delete (state as Record<string, unknown>).recents;
  }

  return state;
}
