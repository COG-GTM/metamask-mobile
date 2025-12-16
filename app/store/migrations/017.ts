import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  const networkOnboarded = state.networkOnboarded as Record<string, unknown> | undefined;
  if (networkOnboarded?.networkOnboardedState) {
    networkOnboarded.networkOnboardedState = {};
  }

  return state;
}
