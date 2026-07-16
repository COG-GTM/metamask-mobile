import { isObject } from '@metamask/utils';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 12)) {
    return state;
  }

  const backgroundState = state.engine.backgroundState;
  const collectiblesController = backgroundState.CollectiblesController;
  const preferencesController = backgroundState.PreferencesController;

  if (!isObject(collectiblesController) || !isObject(preferencesController)) {
    return state;
  }

  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = collectiblesController;
  backgroundState.NftController = {
    ...unexpectedCollectiblesControllerState,
    allNfts: allCollectibles,
    allNftContracts: allCollectibleContracts,
    ignoredNfts: ignoredCollectibles,
  };
  delete backgroundState.CollectiblesController;

  backgroundState.NftDetectionController =
    backgroundState.CollectibleDetectionController;
  delete backgroundState.CollectibleDetectionController;

  preferencesController.useNftDetection =
    preferencesController.useCollectibleDetection;
  delete preferencesController.useCollectibleDetection;

  return state;
}
