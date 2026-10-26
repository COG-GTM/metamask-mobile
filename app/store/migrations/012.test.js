import migrate from './012';

describe('Migration #012', () => {
  it('renames collectibles state to NFT state', () => {
    const state = {
      engine: {
        backgroundState: {
          CollectiblesController: {
            allCollectibles: { a: 1 },
            allCollectibleContracts: { b: 1 },
            ignoredCollectibles: ['c'],
            extra: true,
          },
          CollectibleDetectionController: { d: 1 },
          PreferencesController: { useCollectibleDetection: true },
        },
      },
    };
    const { backgroundState } = migrate(state).engine;
    expect(backgroundState.CollectiblesController).toBeUndefined();
    expect(backgroundState.CollectibleDetectionController).toBeUndefined();
    expect(backgroundState.NftController).toEqual({
      extra: true,
      allNfts: { a: 1 },
      allNftContracts: { b: 1 },
      ignoredNfts: ['c'],
    });
    expect(backgroundState.NftDetectionController).toEqual({ d: 1 });
    expect(backgroundState.PreferencesController).toEqual({
      useNftDetection: true,
    });
  });
});
