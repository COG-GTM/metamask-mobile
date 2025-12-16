import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  const engineState = state.engine as Record<string, Record<string, unknown>> | undefined;
  if (!engineState?.backgroundState) {
    return state;
  }

  const networkController = engineState.backgroundState.NetworkController as Record<string, unknown> | undefined;
  if (!networkController) {
    return state;
  }

  if (networkController.properties) {
    networkController.networkDetails = networkController.properties;
    delete networkController.properties;
  }

  return state;
}
