/* eslint-disable @typescript-eslint/no-explicit-any */
// Legacy persisted state is expected to contain engine.backgroundState.
export default function migrate(state: unknown): Record<string, unknown>;
export default function migrate(state: any) {
  state.engine.backgroundState.TokensController = {
    allTokens: state.engine.backgroundState.AssetsController.allTokens,
    ignoredTokens: state.engine.backgroundState.AssetsController.ignoredTokens,
  };

  state.engine.backgroundState.CollectiblesController = {
    allCollectibles:
      state.engine.backgroundState.AssetsController.allCollectibles,
    allCollectibleContracts:
      state.engine.backgroundState.AssetsController.allCollectibleContracts,
    ignoredCollectibles:
      state.engine.backgroundState.AssetsController.ignoredCollectibles,
  };

  delete state.engine.backgroundState.AssetsController;

  return state;
}
