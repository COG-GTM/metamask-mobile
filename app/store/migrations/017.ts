import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  if (
    isObject(state.networkOnboarded) &&
    isObject(
      (state.networkOnboarded as Record<string, unknown>)
        .networkOnboardedState,
    )
  ) {
    (state.networkOnboarded as Record<string, unknown>).networkOnboardedState =
      {};
  }
  return state;
}
