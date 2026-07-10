import migrate from './005';

describe('Migration #5', () => {
  it('should split AssetsController into TokensController and CollectiblesController', () => {
    const oldState = {
      engine: {
        backgroundState: {
          AssetsController: {
            allTokens: { '0x1': {} },
            ignoredTokens: ['0x2'],
            allCollectibles: { '0x3': {} },
            allCollectibleContracts: { '0x4': {} },
            ignoredCollectibles: ['0x5'],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.AssetsController).toBeUndefined();
    expect(newState.engine.backgroundState.TokensController).toStrictEqual({
      allTokens: { '0x1': {} },
      ignoredTokens: ['0x2'],
    });
    expect(
      newState.engine.backgroundState.CollectiblesController,
    ).toStrictEqual({
      allCollectibles: { '0x3': {} },
      allCollectibleContracts: { '0x4': {} },
      ignoredCollectibles: ['0x5'],
    });
  });
});
