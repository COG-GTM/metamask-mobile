import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): Record<string, unknown> {
  if (!isObject(state)) {
    return state as Record<string, unknown>;
  }

  if ((state as Record<string, unknown>).recents) {
    delete (state as Record<string, unknown>).recents;
  }
  return state as Record<string, unknown>;
}
