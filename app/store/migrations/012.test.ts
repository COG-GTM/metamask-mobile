import migrate from './012';

describe('Migration #12', () => {
  it('renames collectibles state to NFT state', () => {
    const oldState = {
      engine: {
        backgroundState: {
          CollectiblesController: {
            allCollectibles: { a: 1 },
            allCollectibleContracts: { b: 2 },
            ignoredCollectibles: ['c'],
            extra: true,
          },
          CollectibleDetectionController: { d: 4 },
          PreferencesController: { useCollectibleDetection: true, foo: 'bar' },
        },
      },
    };

    expect(migrate(oldState)).toStrictEqual({
      engine: {
        backgroundState: {
          NftController: {
            extra: true,
            allNfts: { a: 1 },
            allNftContracts: { b: 2 },
            ignoredNfts: ['c'],
          },
          NftDetectionController: { d: 4 },
          PreferencesController: { foo: 'bar', useNftDetection: true },
        },
      },
    });
  });
});
