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

  const backgroundState = state.engine.backgroundState as Record<string, unknown>;
  const collectiblesController = backgroundState.CollectiblesController as Record<string, unknown> | undefined;
  const preferencesController = backgroundState.PreferencesController as Record<string, unknown> | undefined;

  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = collectiblesController || {};

  backgroundState.NftController = {
    ...unexpectedCollectiblesControllerState,
    allNfts: allCollectibles,
    allNftContracts: allCollectibleContracts,
    ignoredNfts: ignoredCollectibles,
  };
  delete backgroundState.CollectiblesController;

  backgroundState.NftDetectionController = backgroundState.CollectibleDetectionController;
  delete backgroundState.CollectibleDetectionController;

  if (preferencesController) {
    preferencesController.useNftDetection = preferencesController.useCollectibleDetection;
    delete preferencesController.useCollectibleDetection;
  }

  return state;
}
