import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState) ||
    !isObject(state.engine.backgroundState.CollectiblesController) ||
    !isObject(state.engine.backgroundState.PreferencesController)
  ) {
    captureException(
      new Error(`Migration 12: Invalid state structure for migration`),
    );
    return state;
  }

  const collectiblesController = state.engine.backgroundState
    .CollectiblesController as {
    allCollectibles: unknown;
    allCollectibleContracts: unknown;
    ignoredCollectibles: unknown;
    [key: string]: unknown;
  };
  const preferencesController = state.engine.backgroundState
    .PreferencesController as {
    useCollectibleDetection?: unknown;
    useNftDetection?: unknown;
    [key: string]: unknown;
  };

  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = collectiblesController;
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

  preferencesController.useNftDetection =
    preferencesController.useCollectibleDetection;
  delete preferencesController.useCollectibleDetection;

  return state;
}
