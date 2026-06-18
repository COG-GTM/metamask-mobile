import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) return state;
  if (!isObject(state.engine)) return state;
  if (!isObject(state.engine.backgroundState)) return state;

  const bgState = state.engine.backgroundState;
  const collectiblesController = bgState.CollectiblesController as Record<string, unknown> | undefined;
  if (!isObject(collectiblesController)) return state;

  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = collectiblesController;

  bgState.NftController = {
    ...unexpectedCollectiblesControllerState,
    allNfts: allCollectibles,
    allNftContracts: allCollectibleContracts,
    ignoredNfts: ignoredCollectibles,
  };
  delete bgState.CollectiblesController;

  bgState.NftDetectionController =
    bgState.CollectibleDetectionController;
  delete bgState.CollectibleDetectionController;

  const preferencesController = bgState.PreferencesController as Record<string, unknown> | undefined;
  if (isObject(preferencesController)) {
    preferencesController.useNftDetection =
      preferencesController.useCollectibleDetection;
    delete preferencesController.useCollectibleDetection;
  }

  return state;
}
