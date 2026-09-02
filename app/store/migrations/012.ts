import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

/**
 * Migrate collectible controller state to NFT controller state.
 * @param {unknown} state - Redux state.
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
        `Migration 12: Invalid root engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }
  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 12: Invalid root engine backgroundState: '${typeof state
          .engine.backgroundState}'`,
      ),
    );
    return state;
  }
  const { backgroundState } = state.engine;
  if (!isObject(backgroundState.CollectiblesController)) {
    captureException(
      new Error(
        `Migration 12: Invalid CollectiblesController state: '${typeof backgroundState.CollectiblesController}'`,
      ),
    );
    return state;
  }
  if (!isObject(backgroundState.PreferencesController)) {
    captureException(
      new Error(
        `Migration 12: Invalid PreferencesController state: '${typeof backgroundState.PreferencesController}'`,
      ),
    );
    return state;
  }
  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = backgroundState.CollectiblesController;
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

  backgroundState.PreferencesController.useNftDetection =
    backgroundState.PreferencesController.useCollectibleDetection;
  delete backgroundState.PreferencesController.useCollectibleDetection;

  return state;
}
