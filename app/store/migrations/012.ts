import { isObject } from '@metamask/utils';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 12)) {
    return state;
  }

  const collectiblesControllerState =
    state.engine.backgroundState.CollectiblesController;
  const preferencesControllerState =
    state.engine.backgroundState.PreferencesController;

  if (
    !isObject(collectiblesControllerState) ||
    !isObject(preferencesControllerState)
  ) {
    return state;
  }

  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = collectiblesControllerState;

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

  preferencesControllerState.useNftDetection =
    preferencesControllerState.useCollectibleDetection;
  delete preferencesControllerState.useCollectibleDetection;

  return state;
}
