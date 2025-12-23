import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  if (!isObject(state.engine)) {
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    return state;
  }

  const preferencesControllerState = state.engine.backgroundState.PreferencesController;
  if (!isObject(preferencesControllerState)) {
    return state;
  }

  preferencesControllerState.useTokenDetection = true;
  return state;
}
