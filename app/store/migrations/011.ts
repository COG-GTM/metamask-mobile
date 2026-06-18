import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) return state;
  if (!isObject(state.engine)) return state;
  if (!isObject(state.engine.backgroundState)) return state;

  state.engine.backgroundState.PreferencesController = {
    ...(state.engine.backgroundState.PreferencesController as Record<string, unknown>),
    useTokenDetection: true,
  };
  return state;
}
