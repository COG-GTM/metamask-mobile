import migrate from './002';
import { GOERLI, MAINNET, SEPOLIA } from '../../constants/network';
import { createMigrate, PersistedState } from 'redux-persist';

jest.unmock('redux-persist');

interface Provider {
  type?: string;
  chainId?: string;
  rpcTarget?: string;
  ticker?: string;
}

const createState = (provider: Provider) => ({
  engine: {
    backgroundState: {
      NetworkController: {
        provider,
      },
    },
  },
});

describe('Migration #2', () => {
  it.each([MAINNET, SEPOLIA])(
    'does not change the provider when the current network is the initial network %s',
    (type) => {
      const provider = { type, chainId: '' };

      const newState = migrate(createState(provider));

      expect(newState.engine.backgroundState.NetworkController.provider).toBe(
        provider,
      );
      expect(newState).toStrictEqual(createState({ type, chainId: '' }));
    },
  );

  it.each(['1', '137', '4503599627370476'])(
    'does not change the provider for a custom RPC with valid chainId %s',
    (chainId) => {
      const provider = {
        type: 'rpc',
        chainId,
        rpcTarget: 'https://custom.rpc',
        ticker: 'CUSTOM',
      };

      const newState = migrate(createState(provider));

      expect(newState).toStrictEqual(createState({ ...provider }));
    },
  );

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['zero', '0'],
    ['negative', '-1'],
    ['non-numeric', 'abc'],
    ['above the maximum safe chain ID', '4503599627370477'],
    ['above Number.MAX_SAFE_INTEGER', '9007199254740993'],
  ])(
    'resets the provider to Goerli for a custom RPC with a %s chainId',
    (_scenario, chainId) => {
      const newState = migrate(
        createState({
          type: 'rpc',
          chainId,
          rpcTarget: 'https://custom.rpc',
          ticker: 'CUSTOM',
        }),
      );

      expect(newState).toStrictEqual(
        createState({ ticker: 'ETH', type: GOERLI }),
      );
    },
  );

  it('resets the provider to Goerli when the provider has no type and no chainId', () => {
    const newState = migrate(createState({}));

    expect(newState).toStrictEqual(
      createState({ ticker: 'ETH', type: GOERLI }),
    );
  });

  it('resets an invalid custom RPC provider when run through createMigrate from version 1', async () => {
    const persistedState = {
      ...createState({ type: 'rpc', chainId: '', rpcTarget: 'https://x' }),
      _persist: { version: 1, rehydrated: false },
    } as unknown as PersistedState;

    const migratedState = await createMigrate({ 2: migrate })(
      persistedState,
      2,
    );

    expect(migratedState).toStrictEqual({
      ...createState({ ticker: 'ETH', type: GOERLI }),
      _persist: { version: 1, rehydrated: false },
    });
  });
});
