import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 5: Invalid root state: root state is not an object`),
    );
    return state;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedState = state as Record<string, any>;
  typedState.engine.backgroundState.TokensController = {
    allTokens: typedState.engine.backgroundState.AssetsController.allTokens,
    ignoredTokens:
      typedState.engine.backgroundState.AssetsController.ignoredTokens,
  };

  typedState.engine.backgroundState.CollectiblesController = {
    allCollectibles:
      typedState.engine.backgroundState.AssetsController.allCollectibles,
    allCollectibleContracts:
      typedState.engine.backgroundState.AssetsController
        .allCollectibleContracts,
    ignoredCollectibles:
      typedState.engine.backgroundState.AssetsController.ignoredCollectibles,
  };

  delete typedState.engine.backgroundState.AssetsController;

  return typedState;
}
