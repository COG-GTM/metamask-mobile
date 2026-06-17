import migrate from './005';

describe('Migration #5', () => {
  it('should split AssetsController into Tokens and Collectibles controllers', () => {
    const oldState = {
      engine: {
        backgroundState: {
          AssetsController: {
            allTokens: {},
            ignoredTokens: [],
            allCollectibles: {},
            allCollectibleContracts: {},
            ignoredCollectibles: [],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {},
            ignoredTokens: [],
          },
          CollectiblesController: {
            allCollectibles: {},
            allCollectibleContracts: {},
            ignoredCollectibles: [],
          },
        },
      },
    });
  });
});
