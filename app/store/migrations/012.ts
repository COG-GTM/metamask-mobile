import { isObject, hasProperty } from '@metamask/utils';

interface CollectiblesControllerState {
  allCollectibles?: unknown;
  allCollectibleContracts?: unknown;
  ignoredCollectibles?: unknown;
  [key: string]: unknown;
}

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }
  if (!isObject(state.engine) || !isObject(state.engine.backgroundState)) {
    return state;
  }
  const collectiblesController =
    state.engine.backgroundState.CollectiblesController;
  if (!isObject(collectiblesController)) {
    return state;
  }
  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = collectiblesController as CollectiblesControllerState;
  state.engine.backgroundState.NftController = {
    ...unexpectedCollectiblesControllerState,
    allNfts: allCollectibles,
    allNftContracts: allCollectibleContracts,
    ignoredNfts: ignoredCollectibles,
  };
  delete state.engine.backgroundState.CollectiblesController;

  state.engine.backgroundState.NftDetectionController =
    state.engine.backgroundState.CollectibleDetectionController;
  delete state.engine.backgroundState.CollectibleDetectionController;

  const preferencesController =
    state.engine.backgroundState.PreferencesController;
  if (
    isObject(preferencesController) &&
    hasProperty(preferencesController, 'useCollectibleDetection')
  ) {
    preferencesController.useNftDetection =
      preferencesController.useCollectibleDetection;
    delete preferencesController.useCollectibleDetection;
  }

  return state;
}
