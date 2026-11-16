import { ETHERSCAN_SUPPORTED_CHAIN_IDS } from '@metamask/preferences-controller';
import migrate from './025';

const allChains = (value) =>
  Object.fromEntries(
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).map((chainId) => [
      chainId,
      value,
    ]),
  );

describe('Migration #25', () => {
  it('migrates state from thirdPartyMode to the new incoming transactions networks on preferences controller', () => {
    const oldState = {
      privacy: { thirdPartyApiMode: false },
      engine: {
        backgroundState: {
          PreferencesController: {
            showIncomingTransactions: {
              '0x1': true,
              '0x5': true,
              '0x38': true,
              '0x61': true,
              '0xa': true,
              '0xa869': true,
              '0xaa37dc': true,
              '0x89': true,
              '0x13881': true,
              '0xa86a': true,
              '0xfa': true,
              '0xfa2': true,
              '0xaa36a7': true,
              '0xe704': true,
              '0xe705': true,
              '0xe708': true,
              '0x504': true,
              '0x507': true,
              '0x505': true,
              '0x64': true,
            },
          },
        },
      },
    };

    const newState = migrate(oldState);
    expect(newState).toStrictEqual({
      privacy: {},
      engine: {
        backgroundState: {
          PreferencesController: {
            showIncomingTransactions: {
              '0x1': false,
              '0x5': false,
              '0x38': false,
              '0x61': false,
              '0xa': false,
              '0xa869': false,
              '0xaa37dc': false,
              '0x89': false,
              '0x13881': false,
              '0xa86a': false,
              '0xfa': false,
              '0xfa2': false,
              '0xaa36a7': false,
              '0xe704': false,
              '0xe705': false,
              '0xe708': false,
              '0x504': false,
              '0x507': false,
              '0x505': false,
              '0x64': false,
            },
          },
        },
      },
    });
  });

  it('creates the map with every supported chain disabled when the user opted out and no map exists', () => {
    const oldState = {
      privacy: { thirdPartyApiMode: false },
      engine: { backgroundState: { PreferencesController: {} } },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      privacy: {},
      engine: {
        backgroundState: {
          PreferencesController: { showIncomingTransactions: allChains(false) },
        },
      },
    });
  });

  it('creates the map with every supported chain enabled when the user opted in and no map exists', () => {
    const oldState = {
      privacy: { thirdPartyApiMode: true },
      engine: { backgroundState: { PreferencesController: {} } },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      privacy: {},
      engine: {
        backgroundState: {
          PreferencesController: { showIncomingTransactions: allChains(true) },
        },
      },
    });
  });

  it('overrides existing entries and preserves unrelated chains when thirdPartyApiMode is true', () => {
    const oldState = {
      privacy: { thirdPartyApiMode: true, otherSetting: 'kept' },
      engine: {
        backgroundState: {
          PreferencesController: {
            showIncomingTransactions: { '0x1': false, '0x539': false },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      privacy: { otherSetting: 'kept' },
      engine: {
        backgroundState: {
          PreferencesController: {
            showIncomingTransactions: { ...allChains(true), '0x539': false },
          },
        },
      },
    });
    expect(newState.privacy).not.toHaveProperty('thirdPartyApiMode');
  });

  it('defaults every supported chain to enabled when thirdPartyApiMode is undefined', () => {
    const oldState = {
      privacy: {},
      engine: { backgroundState: { PreferencesController: {} } },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      privacy: {},
      engine: {
        backgroundState: {
          PreferencesController: { showIncomingTransactions: allChains(true) },
        },
      },
    });
  });

  it('defaults every supported chain to enabled without throwing when privacy is missing', () => {
    const oldState = {
      engine: { backgroundState: { PreferencesController: {} } },
    };

    let newState;
    expect(() => {
      newState = migrate(oldState);
    }).not.toThrow();

    expect(newState).toStrictEqual({
      engine: {
        backgroundState: {
          PreferencesController: { showIncomingTransactions: allChains(true) },
        },
      },
    });
  });

  it('leaves state unchanged apart from removing thirdPartyApiMode when PreferencesController is missing', () => {
    const oldState = {
      privacy: { thirdPartyApiMode: false },
      engine: { backgroundState: { NetworkController: { foo: 'bar' } } },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      privacy: {},
      engine: { backgroundState: { NetworkController: { foo: 'bar' } } },
    });
    expect(newState.engine.backgroundState).not.toHaveProperty(
      'PreferencesController',
    );
  });

  it('returns state unchanged when engine is missing', () => {
    const oldState = { privacy: { thirdPartyApiMode: false } };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({ privacy: {} });
  });

  it('returns the original state without throwing when an error occurs during migration', () => {
    const preferencesController = { showIncomingTransactions: { '0x1': true } };
    const oldState = {
      privacy: {
        get thirdPartyApiMode() {
          throw new Error('unreadable');
        },
      },
      engine: {
        backgroundState: { PreferencesController: preferencesController },
      },
    };

    let newState;
    expect(() => {
      newState = migrate(oldState);
    }).not.toThrow();

    expect(newState).toBe(oldState);
    expect(newState.engine.backgroundState.PreferencesController).toStrictEqual(
      { showIncomingTransactions: { '0x1': true } },
    );
  });
});
