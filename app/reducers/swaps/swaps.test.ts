/* eslint-disable @typescript-eslint/ban-ts-comment */
import { cloneDeep } from 'lodash';
import Device from '../../util/device';
import reducer, {
  initialState,
  SWAPS_SET_LIVENESS,
  SWAPS_SET_HAS_ONBOARDED,
  swapsSmartTxFlagEnabled,
  swapsTokensObjectSelector,
  swapsTokensMultiChainObjectSelector,
  swapsTokensSelector,
  swapsTokensWithBalanceSelector,
  swapsTopAssetsSelector,
  selectSwapsChainFeatureFlags,
} from './index';
import { NetworkClientType } from '@metamask/network-controller';
// eslint-disable-next-line import/no-namespace
import * as tokensControllerSelectors from '../../selectors/tokensController';
import { safeToChecksumAddress } from '../../util/address';
import {
  MOCK_ACCOUNTS_CONTROLLER_STATE,
  internalAccount1,
  internalAccount2,
} from '../../util/test/accountsControllerTestUtils';

jest.mock('../../selectors/tokensController');

const emptyAction = { type: null };

const DEFAULT_FEATURE_FLAGS = {
  ethereum: {
    mobile_active: true,
    extension_active: true,
    fallback_to_v1: false,
    fallbackToV1: false,
    mobileActive: true,
    extensionActive: true,
    mobileActiveIOS: true,
    mobileActiveAndroid: true,
    smartTransactions: {
      expectedDeadline: 45,
      maxDeadline: 150,
      mobileReturnTxHashAsap: false,
    },
  },
  bsc: {
    mobile_active: true,
    extension_active: true,
    fallback_to_v1: false,
    fallbackToV1: false,
    mobileActive: true,
    extensionActive: true,
    mobileActiveIOS: true,
    mobileActiveAndroid: true,
    smartTransactions: {},
  },
  smart_transactions: {
    mobile_active: false,
    extension_active: true,
  },
  smartTransactions: {
    mobileActive: false,
    extensionActive: true,
    mobileActiveIOS: false,
    mobileActiveAndroid: false,
  },
};

describe('swaps reducer', () => {
  it('should return initial state', () => {
    const state = reducer(undefined, emptyAction);
    expect(state).toEqual(initialState);
  });

  describe('liveness', () => {
    it('should set isLive to true for iOS when flag is true', () => {
      Device.isIos = jest.fn().mockReturnValue(true);
      Device.isAndroid = jest.fn().mockReturnValue(false);

      const initalState = reducer(undefined, emptyAction);
      // @ts-ignore
      const liveState = reducer(initalState, {
        type: SWAPS_SET_LIVENESS,
        payload: {
          featureFlags: DEFAULT_FEATURE_FLAGS,
          chainId: '0x1',
        },
      });
      expect(liveState['0x1'].isLive).toBe(true);
    });
    it('should set isLive to false for iOS when flag is false', () => {
      Device.isIos = jest.fn().mockReturnValue(true);
      Device.isAndroid = jest.fn().mockReturnValue(false);

      const initalState = reducer(undefined, emptyAction);
      const featureFlags = cloneDeep(DEFAULT_FEATURE_FLAGS);
      featureFlags.ethereum = {
        mobile_active: false,
        extension_active: true,
        fallback_to_v1: false,
        fallbackToV1: false,
        mobileActive: false,
        extensionActive: true,
        mobileActiveIOS: false,
        mobileActiveAndroid: true,
        smartTransactions: {
          expectedDeadline: 45,
          maxDeadline: 150,
          mobileReturnTxHashAsap: false,
        },
      };

      // @ts-ignore
      const liveState = reducer(initalState, {
        type: SWAPS_SET_LIVENESS,
        payload: {
          featureFlags,
          chainId: '0x1',
        },
      });
      expect(liveState['0x1'].isLive).toBe(false);
    });
    it('should set isLive to true for Android when flag is true', () => {
      Device.isIos = jest.fn().mockReturnValue(false);
      Device.isAndroid = jest.fn().mockReturnValue(true);

      const initalState = reducer(undefined, emptyAction);
      const featureFlags = cloneDeep(DEFAULT_FEATURE_FLAGS);
      featureFlags.ethereum = {
        mobile_active: true,
        extension_active: true,
        fallback_to_v1: false,
        fallbackToV1: false,
        mobileActive: true,
        extensionActive: true,
        mobileActiveIOS: true,
        mobileActiveAndroid: true,
        smartTransactions: {
          expectedDeadline: 45,
          maxDeadline: 150,
          mobileReturnTxHashAsap: false,
        },
      };

      // @ts-ignore
      const liveState = reducer(initalState, {
        type: SWAPS_SET_LIVENESS,
        payload: {
          featureFlags,
          chainId: '0x1',
        },
      });
      expect(liveState['0x1'].isLive).toBe(true);
    });
    it('should set isLive to false for Android when flag is false', () => {
      Device.isIos = jest.fn().mockReturnValue(false);
      Device.isAndroid = jest.fn().mockReturnValue(true);

      const initalState = reducer(undefined, emptyAction);
      const featureFlags = cloneDeep(DEFAULT_FEATURE_FLAGS);
      featureFlags.ethereum = {
        mobile_active: false,
        extension_active: true,
        fallback_to_v1: false,
        fallbackToV1: false,
        mobileActive: false,
        extensionActive: true,
        mobileActiveIOS: false,
        mobileActiveAndroid: false,
        smartTransactions: {
          expectedDeadline: 45,
          maxDeadline: 150,
          mobileReturnTxHashAsap: false,
        },
      };

      // @ts-ignore
      const liveState = reducer(initalState, {
        type: SWAPS_SET_LIVENESS,
        payload: {
          featureFlags,
          chainId: '0x1',
        },
      });
      expect(liveState['0x1'].isLive).toBe(false);
    });
  });

  describe('swapsSmartTxFlagEnabled', () => {
    it('should return true if smart transactions are enabled', () => {
      const rootState = {
        engine: {
          backgroundState: {
            NetworkController: {
              getNetworkClientById: () => ({
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                configuration: {
                  rpcUrl: 'https://mainnet.infura.io/v3',
                  chainId: '0x1',
                  ticker: 'ETH',
                  type: NetworkClientType.Custom,
                },
              }),
              networkConfigurations: {
                mainnet: {
                  id: 'mainnet',
                  rpcUrl: 'https://mainnet.infura.io/v3',
                  chainId: '0x1',
                  ticker: 'ETH',
                  nickname: 'Ethereum mainnet',
                  rpcPrefs: {
                    blockExplorerUrl: 'https://etherscan.com',
                  },
                },
              },
              selectedNetworkClientId: 'mainnet',
              networksMetadata: {},
            },
          },
        },
        swaps: cloneDeep(initialState),
      };

      rootState.swaps = {
        // @ts-ignore
        featureFlags: {
          smart_transactions: {
            mobile_active: true,
            extension_active: true,
          },
          smartTransactions: {
            mobileActive: true,
            extensionActive: true,
            mobileActiveIOS: true,
            mobileActiveAndroid: true,
          },
        },
        '0x1': {
          // @ts-ignore
          featureFlags: {
            smartTransactions: {
              expectedDeadline: 45,
              maxDeadline: 150,
              mobileReturnTxHashAsap: false,
            },
          },
        },
      };

      const enabled = swapsSmartTxFlagEnabled(rootState);
      expect(enabled).toEqual(true);
    });

    it('should return false if smart transactions flags are disabled', () => {
      const rootState = {
        engine: {
          backgroundState: {
            NetworkController: {
              selectedNetworkClientId: 'mainnet',
              networksMetadata: {},
              networkConfigurations: {
                mainnet: {
                  id: 'mainnet',
                  rpcUrl: 'https://mainnet.infura.io/v3',
                  chainId: '0x36bbbe6d',
                  ticker: 'ETH',
                  nickname: 'Sepolia network',
                  rpcPrefs: {
                    blockExplorerUrl: 'https://etherscan.com',
                  },
                },
              },
            },
          },
        },
        swaps: cloneDeep(initialState),
      };

      rootState.swaps = {
        // @ts-ignore
        featureFlags: {
          smart_transactions: {
            mobile_active: false,
            extension_active: true,
          },
          smartTransactions: {
            mobileActive: false,
            extensionActive: true,
            mobileActiveIOS: false,
            mobileActiveAndroid: false,
          },
        },
        '0x1': {
          // @ts-ignore
          featureFlags: {
            smartTransactions: {
              expectedDeadline: 45,
              maxDeadline: 150,
              mobileReturnTxHashAsap: false,
            },
          },
        },
      };

      const enabled = swapsSmartTxFlagEnabled(rootState);
      expect(enabled).toEqual(false);
    });

    it('should return false if smart transactions flags are undefined', () => {
      const rootState = {
        engine: {
          backgroundState: {
            NetworkController: {
              selectedNetworkClientId: 'mainnet',
              networksMetadata: {},
              networkConfigurations: {
                mainnet: {
                  id: 'mainnet',
                  rpcUrl: 'https://mainnet.infura.io/v3',
                  chainId: '0x36bbbe6d',
                  ticker: 'ETH',
                  nickname: 'Sepolia network',
                  rpcPrefs: {
                    blockExplorerUrl: 'https://etherscan.com',
                  },
                },
              },
            },
          },
        },
        swaps: initialState,
      };

      const enabled = swapsSmartTxFlagEnabled(rootState);
      expect(enabled).toEqual(false);
    });
  });

  describe('selectSwapsChainFeatureFlags', () => {
    const createTestState = ({
      selectedChainId = '0x1',
      globalFeatureFlags = {},
      chainFeatureFlags = {},
    } = {}) => ({
      engine: {
        backgroundState: {
          NetworkController: {
            selectedNetworkClientId: 'mainnet',
            networkConfigurations: {
              mainnet: {
                id: 'mainnet',
                chainId: selectedChainId,
              },
            },
            getNetworkClientById: () => ({
              configuration: {
                chainId: selectedChainId,
              },
            }),
          },
        },
      },
      swaps: {
        featureFlags: globalFeatureFlags,
        ...Object.entries(chainFeatureFlags).reduce(
          (acc, [chainId, flags]) => ({ ...acc, [chainId]: { featureFlags: flags } }),
          {}
        ),
      },
    });

    it('should return chain feature flags with merged smartTransactions from global flags', () => {
      const globalFlags = {
        smartTransactions: {
          mobileActive: true,
          extensionActive: true,
          globalSetting: true,
        },
      };
      
      const chainFlags = {
        '0x1': {
          fallbackToV1: false,
          mobileActive: true,
          smartTransactions: {
            chainSpecificSetting: true,
          },
        },
      };
      
      const rootState = createTestState({
        globalFeatureFlags: globalFlags,
        chainFeatureFlags: chainFlags,
      });
      
      const result = selectSwapsChainFeatureFlags(rootState);
      expect(result).toEqual({
        fallbackToV1: false,
        mobileActive: true,
        smartTransactions: {
          chainSpecificSetting: true,
          globalSetting: true,
          mobileActive: true,
          extensionActive: true,
        },
      });
    });

    it('should use provided transactionChainId instead of current chainId', () => {
      const rootState = createTestState({
        globalFeatureFlags: {
          smartTransactions: {
            globalSetting: true,
          },
        },
        chainFeatureFlags: {
          '0x1': {
            mainnetFlag: true,
          },
          '0x5': {
            goerliFlag: true,
            smartTransactions: {
              goerliSetting: true,
            },
          },
        },
      });

      const chainFlags = selectSwapsChainFeatureFlags(rootState, '0x5');
      expect(chainFlags).toEqual({
        goerliFlag: true,
        smartTransactions: {
          goerliSetting: true,
          globalSetting: true,
        },
      });
    });

    it('should handle missing feature flags gracefully', () => {
      const rootState = createTestState({
        globalFeatureFlags: {
          smartTransactions: {
            globalSetting: true,
          },
        },
        chainFeatureFlags: {
          '0x1': {},  // Empty feature flags
        },
      });

      const chainFlags = selectSwapsChainFeatureFlags(rootState);
      expect(chainFlags).toEqual({
        smartTransactions: {
          globalSetting: true,
        },
      });
    });

    it('should throw when no chain entry exists', () => {
      const rootState = createTestState({
        selectedChainId: '0x89',  // Chain ID not in swaps state
        globalFeatureFlags: {
          smartTransactions: {
            globalSetting: true,
          },
        },
        // No chain feature flags for 0x89
      });

      expect(() => selectSwapsChainFeatureFlags(rootState)).toThrow();
    });
  });

  describe('swapsTokensObjectSelector', () => {
    it('should return a object that returns an object combining TokensController and SwapsController tokens where each key is an address and each value is undefined', () => {
      jest.spyOn(tokensControllerSelectors, 'selectTokens').mockReturnValue([
        {
          address: '0x0000000000000000000000000000000000000010',
          symbol: 'TOKEN1',
          decimals: 1,
          aggregators: [],
        },
        {
          address: '0x0000000000000000000000000000000000000011',
          symbol: 'TOKEN2',
          decimals: 2,
          aggregators: [],
        },
      ]);
      const state = {
        engine: {
          backgroundState: {
            SwapsController: {
              tokens: [
                {
                  address: '0x0000000000000000000000000000000000000000',
                  symbol: 'SWAPS-TOKEN1',
                  decimals: 1,
                  occurrences: 10,
                  iconUrl: 'https://some.token.icon.url/1',
                },
                {
                  address: '0x0000000000000000000000000000000000000001',
                  symbol: 'SWAPS-TOKEN2',
                  decimals: 2,
                  occurrences: 20,
                  iconUrl: 'https://some.token.icon.url/2',
                },
              ],
            },
          },
        },
      };
      expect(swapsTokensObjectSelector(state)).toStrictEqual({
        '0x0000000000000000000000000000000000000000': undefined,
        '0x0000000000000000000000000000000000000001': undefined,
        '0x0000000000000000000000000000000000000010': undefined,
        '0x0000000000000000000000000000000000000011': undefined,
      });
    });

    it('should return an empty object if there are no Swaps tokens or user tokens', () => {
      jest.spyOn(tokensControllerSelectors, 'selectTokens').mockReturnValue([]);
      const state = {
        engine: {
          backgroundState: {
            SwapsController: {
              tokens: [],
            },
          },
        },
      };
      expect(swapsTokensObjectSelector(state)).toStrictEqual({});
    });
  });

  describe('swaps token-list selectors', () => {
    const MAINNET = '0x1';
    const POLYGON = '0x89';
    const selectedAddress = internalAccount2.address;
    const otherAddress = internalAccount1.address;

    const tokenAddress = (i: number) =>
      `0x${'ab'.repeat(19)}${i.toString(16).padStart(2, '0')}`;
    const checksum = (i: number) =>
      safeToChecksumAddress(tokenAddress(i)) as string;

    const swapsToken = (i: number) => ({
      address: tokenAddress(i),
      symbol: `T${i}`,
      decimals: 18,
      occurrences: 10,
    });

    const createTokenListState = ({
      chainId = MAINNET,
      swapsTokens = [] as Record<string, unknown>[],
      topAssets,
      balances = {},
      tokenListData = {},
    }: {
      chainId?: string;
      swapsTokens?: Record<string, unknown>[];
      topAssets?: { address: string }[];
      balances?: Record<string, unknown>;
      tokenListData?: Record<string, { name: string }>;
    } = {}) => ({
      engine: {
        backgroundState: {
          NetworkController: {
            selectedNetworkClientId: 'selected-client',
            networkConfigurationsByChainId: {
              [chainId]: {
                chainId,
                name: 'Test network',
                nativeCurrency: 'ETH',
                blockExplorerUrls: [],
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [
                  {
                    networkClientId: 'selected-client',
                    url: 'https://rpc.test',
                    type: 'custom',
                  },
                ],
              },
            },
          },
          AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
          TokenListController: {
            tokensChainsCache: {
              [chainId]: { data: tokenListData },
            },
          },
          TokenBalancesController: {
            tokenBalances: {
              [selectedAddress]: { [chainId]: balances },
            },
          },
          SwapsController: {
            tokens: swapsTokens,
            topAssets,
          },
        },
      },
    });

    const symbols = (tokens: { symbol: string }[]) =>
      tokens.map(({ symbol }) => symbol);

    beforeEach(() => {
      jest.spyOn(tokensControllerSelectors, 'selectTokens').mockReturnValue([]);
      jest
        .spyOn(tokensControllerSelectors, 'selectAllTokens')
        .mockReturnValue({});
    });

    describe('swapsTokensSelector', () => {
      it('dedupes swaps and user tokens by lowercase address, coerces decimals and strips image/hasBalanceError', () => {
        jest.spyOn(tokensControllerSelectors, 'selectTokens').mockReturnValue([
          {
            address: checksum(1),
            symbol: 'USER-DUP',
            decimals: '6',
            aggregators: [],
          },
          {
            address: checksum(2),
            symbol: 'USER2',
            decimals: '6',
            image: 'https://user.token/2.png',
            hasBalanceError: true,
            aggregators: [],
          },
        ] as never);
        const state = createTokenListState({
          chainId: POLYGON,
          swapsTokens: [
            { ...swapsToken(1), address: checksum(1), decimals: '18' },
            { ...swapsToken(1), symbol: 'SWAPS-DUP' },
          ],
        });

        expect(swapsTokensSelector(state)).toStrictEqual([
          {
            occurrences: 10,
            address: tokenAddress(1),
            symbol: 'T1',
            decimals: 18,
          },
          {
            occurrences: 0,
            address: tokenAddress(2),
            symbol: 'USER2',
            decimals: 6,
            aggregators: [],
          },
        ]);
      });

      it('adds token list names on mainnet only', () => {
        const tokenListData = { [checksum(1)]: { name: 'Token One' } };
        const swapsTokens = [swapsToken(1), swapsToken(2)];

        const mainnetTokens = swapsTokensSelector(
          createTokenListState({ swapsTokens, tokenListData }),
        );
        expect(mainnetTokens[0].name).toBe('Token One');
        expect(mainnetTokens[1]).not.toHaveProperty('name');

        const polygonTokens = swapsTokensSelector(
          createTokenListState({
            chainId: POLYGON,
            swapsTokens,
            tokenListData,
          }),
        );
        polygonTokens.forEach((token: Record<string, unknown>) =>
          expect(token).not.toHaveProperty('name'),
        );
      });
    });

    describe('swapsTokensWithBalanceSelector', () => {
      const sevenTokens = [0, 1, 2, 3, 4, 5, 6].map(swapsToken);

      it('puts held tokens first and caps the list at 5 when fewer than 5 are held', () => {
        const state = createTokenListState({
          chainId: POLYGON,
          swapsTokens: sevenTokens,
          balances: { [checksum(5)]: 1, [checksum(2)]: 100 },
        });

        const result = swapsTokensWithBalanceSelector(state);
        expect(result).toHaveLength(5);
        expect(symbols(result)).toStrictEqual(['T2', 'T5', 'T0', 'T1', 'T3']);
      });

      it('keeps held tokens in token-list order regardless of balance size', () => {
        const state = createTokenListState({
          chainId: POLYGON,
          swapsTokens: sevenTokens,
          balances: { [checksum(2)]: 1, [checksum(5)]: 100 },
        });

        expect(symbols(swapsTokensWithBalanceSelector(state))).toStrictEqual([
          'T2',
          'T5',
          'T0',
          'T1',
          'T3',
        ]);
      });

      it('returns held tokens then fillers up to 5 when held tokens lead the list', () => {
        const state = createTokenListState({
          chainId: POLYGON,
          swapsTokens: sevenTokens,
          balances: { [checksum(0)]: 3, [checksum(1)]: 2 },
        });

        expect(symbols(swapsTokensWithBalanceSelector(state))).toStrictEqual([
          'T0',
          'T1',
          'T2',
          'T3',
          'T4',
        ]);
      });

      it('returns every held token when more than 5 are held', () => {
        const balances = Object.fromEntries(
          [6, 5, 4, 3, 2, 1].map((i) => [checksum(i), i]),
        );
        const state = createTokenListState({
          chainId: POLYGON,
          swapsTokens: sevenTokens,
          balances,
        });

        const result = swapsTokensWithBalanceSelector(state);
        expect(result).toHaveLength(6);
        expect(symbols(result)).toStrictEqual([
          'T1',
          'T2',
          'T3',
          'T4',
          'T5',
          'T6',
        ]);
      });

      it('ignores zero balances', () => {
        const state = createTokenListState({
          chainId: POLYGON,
          swapsTokens: sevenTokens,
          balances: { [checksum(3)]: 0, [checksum(4)]: 7 },
        });

        expect(symbols(swapsTokensWithBalanceSelector(state))).toStrictEqual([
          'T4',
          'T0',
          'T1',
          'T2',
          'T3',
        ]);
      });

      it('matches checksummed balance keys against user tokens with checksummed addresses', () => {
        jest.spyOn(tokensControllerSelectors, 'selectTokens').mockReturnValue([
          {
            address: checksum(9),
            symbol: 'USER9',
            decimals: 18,
            aggregators: [],
          },
        ]);
        const state = createTokenListState({
          chainId: POLYGON,
          swapsTokens: sevenTokens,
          balances: { [checksum(9)]: 1 },
        });

        expect(symbols(swapsTokensWithBalanceSelector(state))).toStrictEqual([
          'USER9',
          'T0',
          'T1',
          'T2',
          'T3',
        ]);
      });

      it('returns the first 5 tokens when nothing is held', () => {
        const state = createTokenListState({
          chainId: POLYGON,
          swapsTokens: sevenTokens,
        });

        expect(symbols(swapsTokensWithBalanceSelector(state))).toStrictEqual([
          'T0',
          'T1',
          'T2',
          'T3',
          'T4',
        ]);
      });

      it('adds token list names on mainnet but not on other chains', () => {
        const tokenListData = { [checksum(2)]: { name: 'Token Two' } };
        const balances = { [checksum(2)]: 1 };

        const [mainnetFirst] = swapsTokensWithBalanceSelector(
          createTokenListState({
            swapsTokens: sevenTokens,
            balances,
            tokenListData,
          }),
        );
        expect(mainnetFirst).toMatchObject({ symbol: 'T2', name: 'Token Two' });

        const [polygonFirst] = swapsTokensWithBalanceSelector(
          createTokenListState({
            chainId: POLYGON,
            swapsTokens: sevenTokens,
            balances,
            tokenListData,
          }),
        );
        expect(polygonFirst.symbol).toBe('T2');
        expect(polygonFirst).not.toHaveProperty('name');
      });
    });

    describe('swapsTopAssetsSelector', () => {
      const swapsTokens = [1, 2, 3].map(swapsToken);

      it('maps top assets to known tokens case-insensitively and drops unknown ones', () => {
        const state = createTokenListState({
          swapsTokens,
          topAssets: [
            { address: checksum(3) },
            { address: tokenAddress(42) },
            { address: tokenAddress(1).toUpperCase().replace('0X', '0x') },
          ],
          tokenListData: { [checksum(3)]: { name: 'Token Three' } },
        });

        const result = swapsTopAssetsSelector(state);
        expect(symbols(result)).toStrictEqual(['T3', 'T1']);
        expect(result[0].name).toBe('Token Three');
        expect(result[1]).not.toHaveProperty('name');
      });

      it('does not add token list names on non-mainnet chains', () => {
        const state = createTokenListState({
          chainId: POLYGON,
          swapsTokens,
          topAssets: [{ address: tokenAddress(3) }],
          tokenListData: { [checksum(3)]: { name: 'Token Three' } },
        });

        const result = swapsTopAssetsSelector(state);
        expect(symbols(result)).toStrictEqual(['T3']);
        expect(result[0]).not.toHaveProperty('name');
      });

      it('returns an empty array when top assets are not loaded', () => {
        expect(
          swapsTopAssetsSelector(createTokenListState({ swapsTokens })),
        ).toStrictEqual([]);
      });
    });

    describe('swapsTokensMultiChainObjectSelector', () => {
      it('includes swaps tokens and the selected account tokens from every chain', () => {
        jest
          .spyOn(tokensControllerSelectors, 'selectAllTokens')
          .mockReturnValue({
            [MAINNET]: {
              [selectedAddress]: [
                { address: checksum(10), symbol: 'U10', decimals: 18 },
              ],
              [otherAddress]: [
                { address: checksum(99), symbol: 'OTHER', decimals: 18 },
              ],
            },
            [POLYGON]: {
              [selectedAddress]: [
                { address: checksum(11), symbol: 'U11', decimals: 6 },
                { address: checksum(1), symbol: 'DUP', decimals: 18 },
              ],
            },
            '0xa': {},
          } as never);
        const state = createTokenListState({ swapsTokens: [swapsToken(1)] });

        expect(swapsTokensMultiChainObjectSelector(state)).toStrictEqual({
          [tokenAddress(1)]: undefined,
          [tokenAddress(10)]: undefined,
          [tokenAddress(11)]: undefined,
        });
      });

      it('returns an empty object when there are no swaps or user tokens', () => {
        jest
          .spyOn(tokensControllerSelectors, 'selectAllTokens')
          .mockReturnValue({ [MAINNET]: { [otherAddress]: [] } } as never);

        expect(
          swapsTokensMultiChainObjectSelector(createTokenListState()),
        ).toStrictEqual({});
      });
    });
  });

  it('should set has onboarded', () => {
    const initalState = reducer(undefined, emptyAction);
    // @ts-ignore
    const notOnboardedState = reducer(initalState, {
      type: SWAPS_SET_HAS_ONBOARDED,
      payload: false,
    });
    expect(notOnboardedState.hasOnboarded).toBe(false);
    // @ts-ignore
    const liveState = reducer(initalState, {
      type: SWAPS_SET_HAS_ONBOARDED,
      payload: true,
    });
    expect(liveState.hasOnboarded).toBe(true);
  });
});

