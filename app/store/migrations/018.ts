// Legacy persisted state shape expected by this migration
interface StateWithTokensController {
  engine: {
    backgroundState: {
      TokensController: {
        suggestedAssets?: unknown;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as StateWithTokensController;
  if (typedState.engine.backgroundState.TokensController.suggestedAssets) {
    delete typedState.engine.backgroundState.TokensController.suggestedAssets;
  }
  return typedState;
}
