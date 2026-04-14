import migrate from './018';

describe('Migration #18', () => {
  it('should remove suggestedAssets from TokensController', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {},
            suggestedAssets: [{ asset: 'test' }],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.TokensController.suggestedAssets).toBeUndefined();
    expect(newState.engine.backgroundState.TokensController.allTokens).toStrictEqual({});
  });

  it('should not change state if suggestedAssets does not exist', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: { '1': {} },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.TokensController.allTokens).toStrictEqual({ '1': {} });
    expect(newState.engine.backgroundState.TokensController.suggestedAssets).toBeUndefined();
  });
});
