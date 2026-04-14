import migrate from './012';

describe('Migration #12', () => {
  it('should rename CollectiblesController to NftController with renamed fields', () => {
    const oldState = {
      engine: {
        backgroundState: {
          CollectiblesController: {
            allCollectibles: { '0x1': [{ tokenId: '1' }] },
            allCollectibleContracts: { '0x1': [{ address: '0xC' }] },
            ignoredCollectibles: [{ tokenId: '2' }],
            extraField: 'preserved',
          },
          CollectibleDetectionController: { enabled: true },
          PreferencesController: {
            useCollectibleDetection: true,
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.NftController).toStrictEqual({
      extraField: 'preserved',
      allNfts: { '0x1': [{ tokenId: '1' }] },
      allNftContracts: { '0x1': [{ address: '0xC' }] },
      ignoredNfts: [{ tokenId: '2' }],
    });
    expect(newState.engine.backgroundState.CollectiblesController).toBeUndefined();
    expect(newState.engine.backgroundState.NftDetectionController).toStrictEqual({ enabled: true });
    expect(newState.engine.backgroundState.CollectibleDetectionController).toBeUndefined();
    expect(newState.engine.backgroundState.PreferencesController.useNftDetection).toBe(true);
    expect(newState.engine.backgroundState.PreferencesController.useCollectibleDetection).toBeUndefined();
  });

  it('should handle empty collections', () => {
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
            useCollectibleDetection: false,
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.NftController.allNfts).toStrictEqual({});
    expect(newState.engine.backgroundState.PreferencesController.useNftDetection).toBe(false);
  });
});
