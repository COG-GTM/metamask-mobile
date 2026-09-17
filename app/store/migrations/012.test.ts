import migrate from './012';

describe('Migration #12', () => {
  it('should rename collectibles state to NFT state', () => {
    const oldState = {
      engine: {
        backgroundState: {
          CollectiblesController: {
            allCollectibles: { '0x1': {} },
            allCollectibleContracts: { '0x2': {} },
            ignoredCollectibles: ['0x3'],
          },
          CollectibleDetectionController: { detecting: false },
          PreferencesController: { useCollectibleDetection: true },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState).toStrictEqual({
      NftController: {
        allNfts: { '0x1': {} },
        allNftContracts: { '0x2': {} },
        ignoredNfts: ['0x3'],
      },
      NftDetectionController: { detecting: false },
      PreferencesController: { useNftDetection: true },
    });
  });
});
