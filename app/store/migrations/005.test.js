import migrate from './005';

describe('Migration #05', () => {
  it('should split AssetsController into TokensController and CollectiblesController', () => {
    const oldState = {
      engine: {
        backgroundState: {
          AssetsController: {
            allTokens: { '0x1': { '1': [{ symbol: 'DAI' }] } },
            ignoredTokens: ['0xIgnored'],
            allCollectibles: { '0x1': { '1': [{ tokenId: '1' }] } },
            allCollectibleContracts: { '0x1': { '1': [{ address: '0xC' }] } },
            ignoredCollectibles: [{ tokenId: '2' }],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.TokensController).toStrictEqual({
      allTokens: { '0x1': { '1': [{ symbol: 'DAI' }] } },
      ignoredTokens: ['0xIgnored'],
    });
    expect(newState.engine.backgroundState.CollectiblesController).toStrictEqual({
      allCollectibles: { '0x1': { '1': [{ tokenId: '1' }] } },
      allCollectibleContracts: { '0x1': { '1': [{ address: '0xC' }] } },
      ignoredCollectibles: [{ tokenId: '2' }],
    });
    expect(newState.engine.backgroundState.AssetsController).toBeUndefined();
  });

  it('should handle empty AssetsController', () => {
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

    expect(newState.engine.backgroundState.TokensController.allTokens).toStrictEqual({});
    expect(newState.engine.backgroundState.AssetsController).toBeUndefined();
  });
});
