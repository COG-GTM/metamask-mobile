import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 012: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (
    !isObject(state.engine) ||
    !isObject(
      (state.engine as Record<string, unknown>).backgroundState,
    )
  ) {
    captureException(
      new Error(`Migration 012: Invalid engine or backgroundState`),
    );
    return state;
  }

  const backgroundState = (state.engine as Record<string, unknown>)
    .backgroundState as Record<string, unknown>;

  if (!isObject(backgroundState.CollectiblesController)) {
    captureException(
      new Error(`Migration 012: Invalid CollectiblesController state`),
    );
    return state;
  }

  const collectiblesController =
    backgroundState.CollectiblesController as Record<string, unknown>;

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

  if (!isObject(backgroundState.PreferencesController)) {
    captureException(
      new Error(`Migration 012: Invalid PreferencesController state`),
    );
    return state;
  }

  const preferencesController =
    backgroundState.PreferencesController as Record<string, unknown>;

  backgroundState.NftDetectionController =
    backgroundState.CollectibleDetectionController;
  delete backgroundState.CollectibleDetectionController;

  preferencesController.useNftDetection =
    preferencesController.useCollectibleDetection;
  delete preferencesController.useCollectibleDetection;

  return state;
}
