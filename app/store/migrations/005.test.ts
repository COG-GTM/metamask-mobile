import migrate from './005';

describe('Migration #5', () => {
  it('splits AssetsController into Tokens and Collectibles controllers', () => {
    const oldState = {
      engine: {
        backgroundState: {
          AssetsController: {
            allTokens: { a: 1 },
            ignoredTokens: ['t'],
            allCollectibles: { b: 2 },
            allCollectibleContracts: { c: 3 },
            ignoredCollectibles: ['c'],
          },
        },
      },
    };

    expect(migrate(oldState)).toStrictEqual({
      engine: {
        backgroundState: {
          TokensController: { allTokens: { a: 1 }, ignoredTokens: ['t'] },
          CollectiblesController: {
            allCollectibles: { b: 2 },
            allCollectibleContracts: { c: 3 },
            ignoredCollectibles: ['c'],
          },
        },
      },
    });
  });
});
