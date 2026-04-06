import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

/**
 * Rename CollectiblesController to NftController,
 * rename CollectibleDetectionController to NftDetectionController,
 * and rename useCollectibleDetection to useNftDetection.
 *
 * @param state - Redux state.
 * @returns Migrated Redux state.
 */
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 12: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 12: Invalid engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 12: Invalid engine backgroundState: '${typeof state.engine
          .backgroundState}'`,
      ),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState.CollectiblesController)) {
    captureException(
      new Error(`Migration 12: Invalid CollectiblesController state`),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState.PreferencesController)) {
    captureException(
      new Error(`Migration 12: Invalid PreferencesController state`),
    );
    return state;
  }

  const collectiblesController = state.engine.backgroundState
    .CollectiblesController as Record<string, unknown>;

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

  const preferencesController = state.engine.backgroundState
    .PreferencesController as Record<string, unknown>;

  preferencesController.useNftDetection =
    preferencesController.useCollectibleDetection;
  delete preferencesController.useCollectibleDetection;

  return state;
}
