import migrate from './022';

describe('Migration #22', () => {
  it('should DisplayNftMedia have the same value as openSeaEnabled and delete openSeaEnabled property and delete nftDetectionDismissed', () => {
    const oldState = {
      user: { nftDetectionDismissed: true },
      engine: {
        backgroundState: { PreferencesController: { openSeaEnabled: true } },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      user: {},
      engine: {
        backgroundState: { PreferencesController: { displayNftMedia: true } },
      },
    });
  });

  it('should set displayNftMedia to false and delete openSeaEnabled when openSeaEnabled is false', () => {
    const oldState = {
      user: {},
      engine: {
        backgroundState: { PreferencesController: { openSeaEnabled: false } },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      user: {},
      engine: {
        backgroundState: { PreferencesController: { displayNftMedia: false } },
      },
    });
  });

  it.each([undefined, null])(
    'should default displayNftMedia to true and delete openSeaEnabled when openSeaEnabled is %s',
    (openSeaEnabled) => {
      const oldState = {
        user: {},
        engine: {
          backgroundState: { PreferencesController: { openSeaEnabled } },
        },
      };

      const newState = migrate(oldState);

      expect(newState).toStrictEqual({
        user: {},
        engine: {
          backgroundState: { PreferencesController: { displayNftMedia: true } },
        },
      });
    },
  );

  it('should not set displayNftMedia when openSeaEnabled is absent', () => {
    const oldState = {
      user: {},
      engine: {
        backgroundState: {
          PreferencesController: { ipfsGateway: 'https://dweb.link/ipfs/' },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      user: {},
      engine: {
        backgroundState: {
          PreferencesController: { ipfsGateway: 'https://dweb.link/ipfs/' },
        },
      },
    });
  });

  it('should keep nftDetectionDismissed when it is false', () => {
    const oldState = {
      user: { nftDetectionDismissed: false },
      engine: {
        backgroundState: { PreferencesController: { openSeaEnabled: true } },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      user: { nftDetectionDismissed: false },
      engine: {
        backgroundState: { PreferencesController: { displayNftMedia: true } },
      },
    });
  });

  it('should return state unchanged when PreferencesController is missing', () => {
    const oldState = {
      user: { nftDetectionDismissed: false },
      engine: { backgroundState: {} },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      user: { nftDetectionDismissed: false },
      engine: { backgroundState: {} },
    });
  });

  it('should migrate PreferencesController when user is missing', () => {
    const oldState = {
      engine: {
        backgroundState: { PreferencesController: { openSeaEnabled: false } },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      engine: {
        backgroundState: { PreferencesController: { displayNftMedia: false } },
      },
    });
  });

  it.each([undefined, {}, { engine: {} }])(
    'should not throw and return state as-is for %p',
    (oldState) => {
      expect(migrate(oldState)).toStrictEqual(oldState);
    },
  );
});
