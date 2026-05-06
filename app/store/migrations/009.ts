import { isObject } from '@metamask/utils';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }
  if (!isObject(state.engine) || !isObject(state.engine.backgroundState)) {
    return state;
  }
  const preferencesController = isObject(
    state.engine.backgroundState.PreferencesController,
  )
    ? state.engine.backgroundState.PreferencesController
    : {};
  state.engine.backgroundState.PreferencesController = {
    ...preferencesController,
    useStaticTokenList: true,
  };
  return state;
}
