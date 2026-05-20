import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): Record<string, unknown> {
  if (!isObject(state)) {
    return state as Record<string, unknown>;
  }

  if (
    isObject(state.networkOnboarded) &&
    (state.networkOnboarded as Record<string, unknown>).networkOnboardedState
  ) {
    (state.networkOnboarded as Record<string, unknown>).networkOnboardedState = {};
  }
  return state as Record<string, unknown>;
}
