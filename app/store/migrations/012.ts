import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

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
      new Error(
        `Migration 12: Invalid CollectiblesController state: '${typeof state
          .engine.backgroundState.CollectiblesController}'`,
      ),
    );
    return state;
  }
  if (!isObject(state.engine.backgroundState.PreferencesController)) {
    captureException(
      new Error(
        `Migration 12: Invalid PreferencesController state: '${typeof state
          .engine.backgroundState.PreferencesController}'`,
      ),
    );
    return state;
  }

  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = state.engine.backgroundState.CollectiblesController as Record<
    string,
    unknown
  >;
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

  (
    state.engine.backgroundState.PreferencesController as Record<
      string,
      unknown
    >
  ).useNftDetection = (
    state.engine.backgroundState.PreferencesController as Record<
      string,
      unknown
    >
  ).useCollectibleDetection;
  delete (
    state.engine.backgroundState.PreferencesController as Record<
      string,
      unknown
    >
  ).useCollectibleDetection;

  return state;
}
