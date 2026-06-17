import migrate from './012';

describe('Migration #12', () => {
  it('should rename Collectibles controllers and preferences to NFT equivalents', () => {
    const oldState = {
      engine: {
        backgroundState: {
          CollectiblesController: {
            allCollectibles: {},
            allCollectibleContracts: {},
            ignoredCollectibles: [],
          },
          CollectibleDetectionController: {},
          PreferencesController: {
            useCollectibleDetection: true,
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      engine: {
        backgroundState: {
          NftController: {
            allNfts: {},
            allNftContracts: {},
            ignoredNfts: [],
          },
          NftDetectionController: {},
          PreferencesController: {
            useNftDetection: true,
          },
        },
      },
    });
  });
});
