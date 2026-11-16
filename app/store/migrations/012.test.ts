import migrate from './012';

const createOldState = () => ({
  engine: {
    backgroundState: {
      CollectiblesController: {
        allCollectibles: {
          '0xabc': { 1: [{ address: '0x1', tokenId: '1' }] },
        },
        allCollectibleContracts: {
          '0xabc': { 1: [{ address: '0x1', name: 'Contract' }] },
        },
        ignoredCollectibles: [{ address: '0x2', tokenId: '2' }],
        extraKey: 'kept',
      },
      CollectibleDetectionController: { lastDetected: 123 },
      PreferencesController: {
        useCollectibleDetection: true,
        openSeaEnabled: true,
      },
      OtherController: { foo: 'bar' },
    },
  },
});

describe('Migration #12', () => {
  it('moves CollectiblesController state to NftController with renamed keys', () => {
    const oldState = createOldState();
    const { allCollectibles, allCollectibleContracts, ignoredCollectibles } =
      oldState.engine.backgroundState.CollectiblesController;

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.NftController).toStrictEqual({
      extraKey: 'kept',
      allNfts: allCollectibles,
      allNftContracts: allCollectibleContracts,
      ignoredNfts: ignoredCollectibles,
    });
    expect(newState.engine.backgroundState).not.toHaveProperty(
      'CollectiblesController',
    );
  });

  it('moves CollectibleDetectionController state to NftDetectionController', () => {
    const oldState = createOldState();
    const detectionState =
      oldState.engine.backgroundState.CollectibleDetectionController;

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.NftDetectionController).toBe(
      detectionState,
    );
    expect(newState.engine.backgroundState).not.toHaveProperty(
      'CollectibleDetectionController',
    );
  });

  it.each([true, false])(
    'renames useCollectibleDetection (%s) to useNftDetection',
    (useCollectibleDetection) => {
      const oldState = createOldState();
      oldState.engine.backgroundState.PreferencesController.useCollectibleDetection =
        useCollectibleDetection;

      const newState = migrate(oldState);

      expect(
        newState.engine.backgroundState.PreferencesController,
      ).toStrictEqual({
        useNftDetection: useCollectibleDetection,
        openSeaEnabled: true,
      });
    },
  );

  it('produces the full expected state and leaves other controllers untouched', () => {
    const newState = migrate(createOldState());

    expect(newState).toStrictEqual({
      engine: {
        backgroundState: {
          NftController: {
            extraKey: 'kept',
            allNfts: {
              '0xabc': { 1: [{ address: '0x1', tokenId: '1' }] },
            },
            allNftContracts: {
              '0xabc': { 1: [{ address: '0x1', name: 'Contract' }] },
            },
            ignoredNfts: [{ address: '0x2', tokenId: '2' }],
          },
          NftDetectionController: { lastDetected: 123 },
          PreferencesController: {
            useNftDetection: true,
            openSeaEnabled: true,
          },
          OtherController: { foo: 'bar' },
        },
      },
    });
  });
});
