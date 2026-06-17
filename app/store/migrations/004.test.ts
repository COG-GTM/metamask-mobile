import migrate from './004';

describe('Migration #4', () => {
  it('should leave empty token and collectible maps unchanged', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {},
          },
          CollectiblesController: {
            allCollectibleContracts: {},
            allCollectibles: {},
          },
          PreferencesController: {
            frequentRpcList: [],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual(oldState);
  });
});
