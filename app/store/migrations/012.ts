import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  const engineState = state.engine as Record<string, Record<string, unknown>> | undefined;
  if (!engineState?.backgroundState) {
    return state;
  }

  const collectiblesController = engineState.backgroundState.CollectiblesController as Record<string, unknown> | undefined;
  if (!collectiblesController) {
    return state;
  }

  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = collectiblesController;

  engineState.backgroundState.NftController = {
    ...unexpectedCollectiblesControllerState,
    allNfts: allCollectibles,
    allNftContracts: allCollectibleContracts,
    ignoredNfts: ignoredCollectibles,
  };
  delete engineState.backgroundState.CollectiblesController;

  const collectibleDetectionController = engineState.backgroundState.CollectibleDetectionController;
  engineState.backgroundState.NftDetectionController = collectibleDetectionController;
  delete engineState.backgroundState.CollectibleDetectionController;

  const preferencesController = engineState.backgroundState.PreferencesController as Record<string, unknown> | undefined;
  if (preferencesController) {
    preferencesController.useNftDetection = preferencesController.useCollectibleDetection;
    delete preferencesController.useCollectibleDetection;
  }

  return state;
}
