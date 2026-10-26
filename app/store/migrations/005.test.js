import migrate from './005';

describe('Migration #005', () => {
  it('splits AssetsController into tokens and collectibles controllers', () => {
    const state = {
      engine: {
        backgroundState: {
          AssetsController: {
            allTokens: { a: 1 },
            ignoredTokens: ['b'],
            allCollectibles: { c: 1 },
            allCollectibleContracts: { d: 1 },
            ignoredCollectibles: ['e'],
          },
        },
      },
    };
    const { backgroundState } = migrate(state).engine;
    expect(backgroundState.AssetsController).toBeUndefined();
    expect(backgroundState.TokensController).toEqual({
      allTokens: { a: 1 },
      ignoredTokens: ['b'],
    });
    expect(backgroundState.CollectiblesController).toEqual({
      allCollectibles: { c: 1 },
      allCollectibleContracts: { d: 1 },
      ignoredCollectibles: ['e'],
    });
  });
});
