import {
  MigrationManifest,
  PersistedState,
  createMigrate,
} from 'redux-persist';
import migrate from './004';
import migrate005 from './005';
import { asyncifyMigrations, migrationList } from './';

jest.unmock('redux-persist');
jest.mock('../../store', () => jest.fn());
jest.mock('react-native-default-preference', () => ({
  set: jest.fn(),
  clear: jest.fn(),
  getAll: jest.fn().mockReturnValue({}),
}));

const ACCOUNT = '0xc4955c0d639d99699bfd7ec54d9fafee40e4d272';
const TOKEN = { address: '0x6b175474e89094c44da98b954eedeac495271d0f' };
const COLLECTIBLE = { address: '0x06012c8cf97bead5deae237070f9587f8e7a266d' };
const COLLECTIBLE_CONTRACT = { name: 'CryptoKitties', ...COLLECTIBLE };

const frequentRpcList = [
  { rpcUrl: 'https://rpc.one', chainId: '100' },
  { rpcUrl: 'https://rpc.two', chainId: '137' },
];

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildState = (overrides: Record<string, any> = {}): any => ({
  engine: {
    backgroundState: {
      TokensController: { allTokens: {}, ignoredTokens: [] },
      CollectiblesController: {
        allCollectibles: {},
        allCollectibleContracts: {},
        ignoredCollectibles: [],
      },
      PreferencesController: { frequentRpcList: [] },
      ...overrides,
    },
  },
});

describe('Migration #4', () => {
  it.each([
    ['mainnet', '1'],
    ['ropsten', '3'],
    ['rinkeby', '4'],
    ['goerli', '5'],
    ['kovan', '42'],
  ])(
    're-keys %s token, collectible and collectible contract maps to chainId %s',
    (networkType, chainId) => {
      const state = buildState({
        TokensController: {
          allTokens: { [ACCOUNT]: { [networkType]: [TOKEN] } },
          ignoredTokens: [],
        },
        CollectiblesController: {
          allCollectibles: { [ACCOUNT]: { [networkType]: [COLLECTIBLE] } },
          allCollectibleContracts: {
            [ACCOUNT]: { [networkType]: [COLLECTIBLE_CONTRACT] },
          },
          ignoredCollectibles: [],
        },
      });

      const { backgroundState } = migrate(state).engine;

      expect(backgroundState.TokensController).toStrictEqual({
        allTokens: { [ACCOUNT]: { [chainId]: [TOKEN] } },
        ignoredTokens: [],
      });
      expect(backgroundState.CollectiblesController).toStrictEqual({
        allCollectibles: { [ACCOUNT]: { [chainId]: [COLLECTIBLE] } },
        allCollectibleContracts: {
          [ACCOUNT]: { [chainId]: [COLLECTIBLE_CONTRACT] },
        },
        ignoredCollectibles: [],
      });
    },
  );

  it('copies custom network assets to every frequentRpcList chainId', () => {
    const state = buildState({
      TokensController: {
        allTokens: { [ACCOUNT]: { rpc: [TOKEN], mainnet: [] } },
      },
      CollectiblesController: {
        allCollectibles: { [ACCOUNT]: { rpc: [COLLECTIBLE] } },
        allCollectibleContracts: { [ACCOUNT]: { rpc: [COLLECTIBLE_CONTRACT] } },
      },
      PreferencesController: { frequentRpcList },
    });

    const { backgroundState } = migrate(state).engine;

    expect(backgroundState.TokensController.allTokens).toStrictEqual({
      [ACCOUNT]: { 1: [], 100: [TOKEN], 137: [TOKEN] },
    });
    expect(backgroundState.CollectiblesController).toStrictEqual({
      allCollectibles: {
        [ACCOUNT]: { 100: [COLLECTIBLE], 137: [COLLECTIBLE] },
      },
      allCollectibleContracts: {
        [ACCOUNT]: {
          100: [COLLECTIBLE_CONTRACT],
          137: [COLLECTIBLE_CONTRACT],
        },
      },
    });
  });

  it('drops custom network assets when there is no frequentRpcList entry to copy them to', () => {
    const state = buildState({
      TokensController: { allTokens: { [ACCOUNT]: { rpc: [TOKEN] } } },
      PreferencesController: { frequentRpcList: [{ rpcUrl: 'https://x' }] },
    });

    expect(
      migrate(state).engine.backgroundState.TokensController.allTokens,
    ).toStrictEqual({ [ACCOUNT]: {} });
  });

  it('treats inherited object keys as custom networks, not known chainIds', () => {
    const state = buildState({
      TokensController: { allTokens: { [ACCOUNT]: { constructor: [TOKEN] } } },
      PreferencesController: { frequentRpcList: [frequentRpcList[0]] },
    });

    expect(
      migrate(state).engine.backgroundState.TokensController.allTokens,
    ).toStrictEqual({ [ACCOUNT]: { 100: [TOKEN] } });
  });

  it('keeps empty maps empty', () => {
    const state = buildState();

    expect(migrate(buildState())).toStrictEqual(state);
  });

  it('does not throw when CollectiblesController, PreferencesController or maps are missing', () => {
    const state = {
      engine: {
        backgroundState: {
          TokensController: { allTokens: { [ACCOUNT]: { mainnet: [TOKEN] } } },
        },
      },
    };

    expect(migrate(state)).toStrictEqual({
      engine: {
        backgroundState: {
          TokensController: { allTokens: { [ACCOUNT]: { 1: [TOKEN] } } },
        },
      },
    });
  });

  it('returns state unchanged when engine background state is missing', () => {
    expect(migrate({ foo: 'bar' })).toStrictEqual({ foo: 'bar' });
  });

  it('re-keys pre-v4 AssetsController state so migration #5 moves chainId-keyed maps', () => {
    const state = buildState({
      TokensController: undefined,
      CollectiblesController: undefined,
      AssetsController: {
        allTokens: { [ACCOUNT]: { mainnet: [TOKEN], rpc: [TOKEN] } },
        ignoredTokens: [],
        allCollectibles: { [ACCOUNT]: { goerli: [COLLECTIBLE] } },
        allCollectibleContracts: {
          [ACCOUNT]: { goerli: [COLLECTIBLE_CONTRACT] },
        },
        ignoredCollectibles: [],
      },
      PreferencesController: { frequentRpcList: [frequentRpcList[0]] },
    });

    const { backgroundState } = migrate005(migrate(state)).engine;

    expect(backgroundState.AssetsController).toBeUndefined();
    expect(backgroundState.TokensController).toStrictEqual({
      allTokens: { [ACCOUNT]: { 1: [TOKEN], 100: [TOKEN] } },
      ignoredTokens: [],
    });
    expect(backgroundState.CollectiblesController).toStrictEqual({
      allCollectibles: { [ACCOUNT]: { 5: [COLLECTIBLE] } },
      allCollectibleContracts: { [ACCOUNT]: { 5: [COLLECTIBLE_CONTRACT] } },
      ignoredCollectibles: [],
    });
  });

  it('runs through redux-persist createMigrate for persisted state at version 3', async () => {
    const persistedState = {
      ...buildState({
        TokensController: undefined,
        CollectiblesController: undefined,
        AssetsController: {
          allTokens: { [ACCOUNT]: { mainnet: [TOKEN] } },
          allCollectibles: {},
          allCollectibleContracts: {},
        },
      }),
      _persist: { version: 3, rehydrated: false },
    } as unknown as PersistedState;

    const migratedState = await createMigrate(
      asyncifyMigrations({
        4: migrationList[4],
      }) as unknown as MigrationManifest,
      { debug: false },
    )(persistedState, 4);

    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(
      (migratedState as any).engine.backgroundState.AssetsController,
    ).toStrictEqual({
      allTokens: { [ACCOUNT]: { 1: [TOKEN] } },
      allCollectibles: {},
      allCollectibleContracts: {},
    });
  });
});
