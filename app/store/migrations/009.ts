import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  const engineState = state.engine as Record<string, Record<string, unknown>> | undefined;
  if (!engineState?.backgroundState) {
    return state;
  }

  const preferencesController = engineState.backgroundState.PreferencesController as Record<string, unknown> | undefined;
  if (!preferencesController) {
    return state;
  }

  engineState.backgroundState.PreferencesController = {
    ...preferencesController,
    useStaticTokenList: true,
  };

  return state;
}
