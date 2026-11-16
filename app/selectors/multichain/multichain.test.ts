import { RootState } from '../../reducers';
import {
  selectMultichainDefaultToken,
  selectMultichainIsMainnet,
  selectMultichainSelectedAccountCachedBalance,
  selectMultichainShouldShowFiat,
  selectMultichainConversionRate,
  MultichainNativeAssets,
  selectMultichainCoinRates,
  selectMultichainBalances,
  MULTICHAIN_NETWORK_TO_ASSET_TYPES,
  selectMultichainTransactions,
  selectSelectedAccountMultichainNetworkAggregatedBalance,
  selectSolanaAccountTransactions,
  selectMultichainHistoricalPrices,
  makeSelectNonEvmAssetById,
  selectMultichainTokenListForAccountId,
  selectMultichainNetworkAggregatedBalanceForAllAccounts,
} from './multichain';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import {
  MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET,
  MOCK_ACCOUNT_BIP122_P2WPKH,
  MOCK_SOLANA_ACCOUNT,
} from '../../util/test/accountsControllerTestUtils';
import { CaipAssetType, Hex } from '@metamask/utils';
import { selectAccountBalanceByChainId } from '../accountTrackerController';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { selectIsEvmNetworkSelected } from '../multichainNetworkController';
import { BtcScope, SolAccountType, SolScope } from '@metamask/keyring-api';

function getEvmState(
  chainId?: Hex,
  mockEvmConversionRate: number = 1500,
  showFiatOnTestnets: boolean = true,
): RootState {
  const {
    MOCK_ACCOUNTS_CONTROLLER_STATE: mockEvmAccountsState,
    MOCK_ACCOUNT_BIP122_P2WPKH: mockBtcAccount,
    MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET: mockBtcTestnetAccount,
  } = jest.requireActual('../../util/test/accountsControllerTestUtils');

  const { mockNetworkState } = jest.requireActual('../../util/test/network');

  const currentChainId = chainId ?? CHAIN_IDS.MAINNET;
  const state = {
    engine: {
      backgroundState: {
        NetworkController: {
          ...mockNetworkState({
            id: 'mainnet',
            nickname: 'Ethereum Mainnet',
            ticker: 'ETH',
            chainId: currentChainId,
          }),
        },
        KeyringController: {
          keyrings: [],
          isUnlocked: true,
          keyringTypes: {},
          vault: '',
          encryptionKey: '',
          encryptionSalt: '',
          memStore: {
            isUnlocked: true,
          },
        },
        AccountsController: mockEvmAccountsState,
        AccountTrackerController: {
          accountsByChainId: {
            '0x1': {
              [toChecksumHexAddress(
                mockEvmAccountsState.internalAccounts.accounts[
                  mockEvmAccountsState.internalAccounts.selectedAccount
                ].address,
              )]: {
                balance: '3',
              },
            },
          },
        },
        MultichainAssetsController: {},
        MultichainAssetsRatesController: {},
        MultichainBalancesController: {
          balances: {
            [mockBtcAccount.id]: {
              [MultichainNativeAssets.Bitcoin]: {
                amount: '1.00000000',
                unit: 'BTC',
              },
            },
            [mockBtcTestnetAccount.id]: {
              [MultichainNativeAssets.BitcoinTestnet]: {
                amount: '2.00000000',
                unit: 'BTC',
              },
            },
          },
        },
        CurrencyRateController: {
          conversionRate: mockEvmConversionRate,
          currentCurrency: 'USD',
          currencyRates: {
            ETH: {
              conversionRate: mockEvmConversionRate,
              conversionDate: new Date().getTime(),
              usdConversionRate: mockEvmConversionRate,
            },
          },
          nativeCurrency: 'ETH',
          pendingCurrentCurrency: null,
          pendingNativeCurrency: null,
        },
        RatesController: {
          rates: {},
          fiatCurrency: 'usd',
          cryptocurrencies: [],
        },
        MultichainNetworkController: {
          isEvmSelected: true,
          selectedMultichainNetworkChainId: SolScope.Mainnet,

          multichainNetworkConfigurationsByChainId: {},
        },
        MultichainTransactionsController: {
          nonEvmTransactions: {
            [MOCK_ACCOUNT_BIP122_P2WPKH.id]: {
              transactions: [],
              next: null,
              lastUpdated: 0,
            },
          },
        },
      },
    },
    settings: {
      showFiatOnTestnets,
    },
  };
  return state as unknown as RootState;
}

function getNonEvmState(
  account?: InternalAccount,
  mockBtcRate?: string,
  showFiatOnTestnets: boolean = true,
): RootState {
  const {
    MOCK_ACCOUNT_BIP122_P2WPKH: mockBtcAccount,
    MOCK_MULTICHAIN_NON_EVM_ACCOUNTS: mockNonEvmAccountsArray,
  } = jest.requireActual('../../util/test/accountsControllerTestUtils');

  const selectedAccount = account ?? mockBtcAccount;

  const selectedNonEvmChainId =
    selectedAccount.type === SolAccountType.DataAccount
      ? SolScope.Mainnet
      : selectedAccount.scopes[0] === BtcScope.Testnet
      ? BtcScope.Testnet
      : BtcScope.Mainnet;

  const state = {
    ...getEvmState(undefined, 1500, showFiatOnTestnets),
    engine: {
      backgroundState: {
        ...getEvmState().engine.backgroundState,
        KeyringController: {
          keyrings: [],
          isUnlocked: true,
          keyringTypes: {},
          vault: '',
          encryptionKey: '',
          encryptionSalt: '',
          memStore: {
            isUnlocked: true,
          },
        },
        AccountsController: {
          internalAccounts: {
            selectedAccount: selectedAccount.id,
            accounts: mockNonEvmAccountsArray,
          },
        },
        MultichainNetworkController: {
          isEvmSelected: false,
          selectedMultichainNetworkChainId: selectedNonEvmChainId,

          multichainNetworkConfigurationsByChainId: {
            [SolScope.Mainnet]: {
              chainId: SolScope.Mainnet,
              name: 'Solana',
              nativeCurrency: 'SOL',
              isEvm: false,
              blockExplorers: {
                urls: ['https://solscan.io'],
                defaultIndex: 0,
              },
              ticker: 'SOL',
              decimals: 9,
            },
            [BtcScope.Mainnet]: {
              chainId: BtcScope.Mainnet,
              name: 'Bitcoin',
              nativeCurrency: 'BTC',
              isEvm: false,
              blockExplorers: {
                urls: [],
                defaultIndex: 0,
              },
              ticker: 'BTC',
              decimals: 8,
            },
            [BtcScope.Testnet]: {
              chainId: BtcScope.Testnet,
              name: 'Bitcoin Testnet',
              nativeCurrency: 'BTC',
              isEvm: false,
              blockExplorers: {
                urls: [],
                defaultIndex: 0,
              },
            },
          },
        },
        RatesController: mockBtcRate
          ? {
              rates: {
                btc: {
                  conversionRate: mockBtcRate,
                  conversionDate: new Date().getTime(),
                  usdConversionRate: mockBtcRate,
                },
              },
              fiatCurrency: 'usd',
              cryptocurrencies: ['btc'],
            }
          : {
              rates: {},
              fiatCurrency: 'usd',
              cryptocurrencies: [],
            },
      },
    },
  };
  return state as unknown as RootState;
}

describe('MultichainNonEvm Selectors', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  describe('selectMultichainIsEvm', () => {
    it('returns true if selected account is EVM compatible', () => {
      const state = getEvmState();

      expect(selectIsEvmNetworkSelected(state)).toBe(true);
    });

    it('returns false if selected account is not EVM compatible', () => {
      const state = getNonEvmState();
      expect(selectIsEvmNetworkSelected(state)).toBe(false);
    });

    it('returns false if selected account is Solana', () => {
      const state = getNonEvmState(MOCK_SOLANA_ACCOUNT);
      expect(selectIsEvmNetworkSelected(state)).toBe(false);
    });
  });
  describe('selectMultichainIsMainnet', () => {
    it('returns true if account is EVM (mainnet)', () => {
      const state = getEvmState();

      expect(selectMultichainIsMainnet(state)).toBe(true);
    });

    it('returns false if account is EVM (testnet)', () => {
      const state = getEvmState(CHAIN_IDS.SEPOLIA);
      expect(selectMultichainIsMainnet(state)).toBe(false);
    });

    it('returns true if account is Solana mainnet', () => {
      const state = getNonEvmState(MOCK_SOLANA_ACCOUNT);
      expect(selectMultichainIsMainnet(state)).toBe(true);
    });

    it.each([
      { isMainnet: true, account: MOCK_ACCOUNT_BIP122_P2WPKH },
      { isMainnet: false, account: MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET },
      { isMainnet: true, account: MOCK_SOLANA_ACCOUNT },
    ])(
      'returns $isMainnet if non-EVM account address "$account.address" is compatible with mainnet',
      ({
        isMainnet,
        account,
      }: {
        isMainnet: boolean;
        account: InternalAccount;
      }) => {
        const state = getNonEvmState(account);
        expect(selectMultichainIsMainnet(state)).toBe(isMainnet);
      },
    );
  });
  describe('selectMultichainShouldShowFiat', () => {
    it('returns true if account is EVM and the network is mainnet', () => {
      const state = getEvmState();
      expect(selectMultichainShouldShowFiat(state)).toBe(true);
    });

    it('returns true if account is EVM on testnet and showFiatInTestnets is true', () => {
      const state = getEvmState(CHAIN_IDS.SEPOLIA, 1500, true);
      expect(selectMultichainShouldShowFiat(state)).toBe(true);
    });

    it('returns false if account is EVM on testnet and showFiatInTestnets is false', () => {
      const state = getEvmState(CHAIN_IDS.SEPOLIA, 1500, false);
      expect(selectMultichainShouldShowFiat(state)).toBe(false);
    });

    it('returns true if account is non-EVM and the network is mainnet', () => {
      const state = getNonEvmState();
      expect(selectMultichainShouldShowFiat(state)).toBe(true);
    });

    it('returns true if account is non-EVM on testnet and showFiatInTestnets is true', () => {
      const state = getNonEvmState(
        MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET,
        undefined,
        true,
      );
      expect(selectMultichainShouldShowFiat(state)).toBe(true);
    });

    it('returns false if account is non-EVM on testnet and showFiatInTestnets is false', () => {
      const state = getNonEvmState(
        MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET,
        undefined,
        false,
      );
      expect(selectMultichainShouldShowFiat(state)).toBe(false);
    });

    it('returns true if Solana account is on mainnet and showFiatInTestnets is false', () => {
      const state = getNonEvmState(MOCK_SOLANA_ACCOUNT, undefined, false);
      expect(selectMultichainShouldShowFiat(state)).toBe(true);
    });
  });
  describe('selectMultichainSelectedAccountCachedBalance', () => {
    it('returns cached balance if account is EVM', () => {
      const state = getEvmState();
      expect(selectMultichainSelectedAccountCachedBalance(state)).toBe(
        selectAccountBalanceByChainId(state)?.balance,
      );
    });

    it.each([
      {
        network: 'mainnet',
        account: MOCK_ACCOUNT_BIP122_P2WPKH,
        asset: MultichainNativeAssets.Bitcoin,
      },
      {
        network: 'testnet',
        account: MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET,
        asset: MultichainNativeAssets.BitcoinTestnet,
      },
    ])(
      'returns cached balance if account is non-EVM: $network',
      ({
        account,
        asset,
      }: {
        account: InternalAccount;
        asset: MultichainNativeAssets;
      }) => {
        const state = getNonEvmState(account);
        const balance =
          state.engine.backgroundState.MultichainBalancesController.balances[
            account.id
          ][asset].amount;

        state.engine.backgroundState.AccountsController.internalAccounts.selectedAccount =
          account.id;
        expect(selectMultichainSelectedAccountCachedBalance(state)).toBe(
          balance,
        );
      },
    );

    it('returns cached balance if account is Solana', () => {
      const mockSolBalance = '5.5';
      const state = getNonEvmState(MOCK_SOLANA_ACCOUNT);
      state.engine.backgroundState.MultichainBalancesController.balances = {
        [MOCK_SOLANA_ACCOUNT.id]: {
          [MultichainNativeAssets.Solana]: {
            amount: mockSolBalance,
            unit: 'SOL',
          },
        },
      };

      state.engine.backgroundState.AccountsController.internalAccounts.selectedAccount =
        MOCK_SOLANA_ACCOUNT.id;
      expect(selectMultichainSelectedAccountCachedBalance(state)).toBe(
        mockSolBalance,
      );
    });
  });
  describe('selectMultichainDefaultToken', () => {
    it('returns ETH if account is EVM', () => {
      const state = getEvmState();

      expect(selectMultichainDefaultToken(state)).toEqual({
        symbol: 'ETH',
      });
    });

    it('returns true if account is non-EVM (bip122:*)', () => {
      const state = getNonEvmState();
      expect(selectMultichainDefaultToken(state)).toEqual({
        symbol: 'BTC',
      });
    });

    it('returns SOL if account is Solana', () => {
      const state = getNonEvmState(MOCK_SOLANA_ACCOUNT);
      expect(selectMultichainDefaultToken(state)).toEqual({
        symbol: 'SOL',
      });
    });
  });

  describe('selectMultichainConversionRate', () => {
    it('returns EVM conversion rate if account is EVM', () => {
      const mockEvmConversionRate = 1500;
      const state = getEvmState(undefined, mockEvmConversionRate);

      expect(selectMultichainConversionRate(state)).toBe(mockEvmConversionRate);
    });

    it('returns non-EVM conversion rate if account is non-EVM', () => {
      const mockBtcConversionRate = '45000.00';
      const state = getNonEvmState(undefined, mockBtcConversionRate);

      expect(selectMultichainConversionRate(state)).toBe(mockBtcConversionRate);
    });

    it('returns undefined if non-EVM ticker is not found', () => {
      const state = getNonEvmState();

      expect(selectMultichainConversionRate(state)).toBeUndefined();
    });

    it('returns Solana conversion rate if account is Solana', () => {
      const mockSolConversionRate = 100;
      const state = getNonEvmState(
        MOCK_SOLANA_ACCOUNT,
        mockSolConversionRate.toString(),
      );
      state.engine.backgroundState.RatesController.rates = {
        sol: {
          conversionRate: mockSolConversionRate,
          conversionDate: new Date().getTime(),
          usdConversionRate: mockSolConversionRate,
        },
      };

      expect(selectMultichainConversionRate(state)).toBe(mockSolConversionRate);
    });
  });

  describe('selectMultichainBalances and selectMultichainCoinRates', () => {
    it('selectMultichainBalances returns balances from the MultichainBalancesController state', () => {
      const state = getEvmState();
      const mockBalances = {
        'account-1': {
          [MultichainNativeAssets.Bitcoin]: { amount: '10', unit: 'BTC' },
        },
      };
      state.engine.backgroundState.MultichainBalancesController.balances =
        mockBalances;
      expect(selectMultichainBalances(state)).toEqual(mockBalances);
    });

    it('selectMultichainCoinRates returns rates from the RatesController state', () => {
      const state = getEvmState();
      const mockRates = {
        eth: {
          conversionRate: 2000,
          conversionDate: Date.now(),
          usdConversionRate: 2000,
        },
      };
      state.engine.backgroundState.RatesController.rates = mockRates;
      expect(selectMultichainCoinRates(state)).toEqual(mockRates);
    });

    it('NETWORK_ASSETS_MAP has correct mappings', () => {
      expect(MULTICHAIN_NETWORK_TO_ASSET_TYPES[SolScope.Mainnet]).toEqual([
        MultichainNativeAssets.Solana,
      ]);
      expect(MULTICHAIN_NETWORK_TO_ASSET_TYPES[SolScope.Testnet]).toEqual([
        MultichainNativeAssets.SolanaTestnet,
      ]);
      expect(MULTICHAIN_NETWORK_TO_ASSET_TYPES[SolScope.Devnet]).toEqual([
        MultichainNativeAssets.SolanaDevnet,
      ]);
      expect(MULTICHAIN_NETWORK_TO_ASSET_TYPES[BtcScope.Mainnet]).toEqual([
        MultichainNativeAssets.Bitcoin,
      ]);
      expect(MULTICHAIN_NETWORK_TO_ASSET_TYPES[BtcScope.Testnet]).toEqual([
        MultichainNativeAssets.BitcoinTestnet,
      ]);
    });
  });

  describe('selectMultichainTransactions', () => {
    it('returns non-EVM transactions from the MultichainTransactionsController state', () => {
      const state = getEvmState();

      const mockTransactions = {
        [MOCK_ACCOUNT_BIP122_P2WPKH.id]: {
          transactions: [
            {
              id: 'some-id',
              timestamp: 1733736433,
              chain: MultichainNativeAssets.Bitcoin,
              status: 'confirmed' as const,
              type: 'send' as const,
              account: MOCK_ACCOUNT_BIP122_P2WPKH.id,
              from: [],
              to: [],
              fees: [],
              events: [],
            },
          ],
          next: null,
          lastUpdated: expect.any(Number),
        },
      };

      state.engine.backgroundState.MultichainTransactionsController = {
        nonEvmTransactions: mockTransactions,
      };

      expect(selectMultichainTransactions(state)).toEqual(mockTransactions);
    });

    it('returns empty object when no transactions exist', () => {
      const state = getEvmState();

      state.engine.backgroundState.MultichainTransactionsController = {
        nonEvmTransactions: {},
      };

      expect(selectMultichainTransactions(state)).toEqual({});
    });
  });

  describe('selectMultichainBalances and selectMultichainCoinRates', () => {
    it('selectMultichainBalances returns balances from the MultichainBalancesController state', () => {
      const state = getEvmState();
      const mockBalances = {
        'account-1': {
          [MultichainNativeAssets.Bitcoin]: { amount: '10', unit: 'BTC' },
        },
      };
      state.engine.backgroundState.MultichainBalancesController.balances =
        mockBalances;
      expect(selectMultichainBalances(state)).toEqual(mockBalances);
    });

    it('NETWORK_ASSETS_MAP has correct mappings', () => {
      expect(MULTICHAIN_NETWORK_TO_ASSET_TYPES[SolScope.Mainnet]).toEqual([
        MultichainNativeAssets.Solana,
      ]);
      expect(MULTICHAIN_NETWORK_TO_ASSET_TYPES[SolScope.Testnet]).toEqual([
        MultichainNativeAssets.SolanaTestnet,
      ]);
      expect(MULTICHAIN_NETWORK_TO_ASSET_TYPES[SolScope.Devnet]).toEqual([
        MultichainNativeAssets.SolanaDevnet,
      ]);
      expect(MULTICHAIN_NETWORK_TO_ASSET_TYPES[BtcScope.Mainnet]).toEqual([
        MultichainNativeAssets.Bitcoin,
      ]);
      expect(MULTICHAIN_NETWORK_TO_ASSET_TYPES[BtcScope.Testnet]).toEqual([
        MultichainNativeAssets.BitcoinTestnet,
      ]);
    });
  });

  describe('selectMultichainNetworkAggregatedBalance', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns aggregated balances in native and fiat', () => {
      const mockState = getNonEvmState(MOCK_SOLANA_ACCOUNT);
      // Get the account ID from the test account to ensure they match
      const solanaAccountId = MOCK_SOLANA_ACCOUNT.id;

      // Use Solana native asset
      const solNativeAssetId = MultichainNativeAssets.Solana;
      // Use a different SPL token (non-native) with a different unit
      const solTokenAssetId = `${SolScope.Mainnet}/token:JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN`;

      const mockBalances = {
        [solanaAccountId]: {
          // Native SOL balance
          [solNativeAssetId]: { amount: '10', unit: 'SOL' },
          // SPL token balance with a different unit
          [solTokenAssetId]: { amount: '20', unit: 'JUP' },
        },
      };

      const mockAssets = {
        [solanaAccountId]: [
          solNativeAssetId,
          solTokenAssetId,
        ] as CaipAssetType[],
      };

      const mockAssetsRates = {
        [solNativeAssetId]: { rate: '100', conversionTime: 0 },
        [solTokenAssetId]: { rate: '2', conversionTime: 0 },
      };

      // Inject mocks into state
      mockState.engine.backgroundState.MultichainBalancesController.balances =
        mockBalances;
      mockState.engine.backgroundState.MultichainAssetsController.accountsAssets =
        mockAssets;
      mockState.engine.backgroundState.MultichainAssetsRatesController.conversionRates =
        mockAssetsRates;

      // Explicitly set the selected account to make sure it matches
      mockState.engine.backgroundState.AccountsController.internalAccounts.selectedAccount =
        solanaAccountId;

      const result =
        selectSelectedAccountMultichainNetworkAggregatedBalance(mockState);

      // Expect only the native asset amount
      expect(result.totalNativeTokenBalance?.amount).toEqual('10');
      expect(result.totalNativeTokenBalance?.unit).toEqual('SOL');
      // Expect total fiat balance: (10 SOL * $100) + (20 JUP * $2) = $1000 + $40 = $1040
      expect(result.totalBalanceFiat).toEqual(1040);
    });

    it('returns undefined balances when no assets found for the chain', () => {
      const mockState = getNonEvmState(MOCK_SOLANA_ACCOUNT);
      // Get the account ID from the test account to ensure they match
      const solanaAccountId = MOCK_SOLANA_ACCOUNT.id;

      // Create mock assets for a different chain (not Solana)
      const btcNativeAssetId = MultichainNativeAssets.Bitcoin;
      const mockAssets = {
        [solanaAccountId]: [btcNativeAssetId] as CaipAssetType[],
      };

      // Set balances only for Bitcoin, not for Solana
      const mockBalances = {
        [solanaAccountId]: {
          // Only BTC balance, no SOL
          [btcNativeAssetId]: { amount: '0.5', unit: 'BTC' },
        },
      };

      // Set rates
      const mockAssetsRates = {
        [btcNativeAssetId]: { rate: '40000', conversionTime: 0 },
      };

      // Inject mocks into state
      mockState.engine.backgroundState.MultichainBalancesController.balances =
        mockBalances;
      mockState.engine.backgroundState.MultichainAssetsController.accountsAssets =
        mockAssets;
      mockState.engine.backgroundState.MultichainAssetsRatesController.conversionRates =
        mockAssetsRates;

      // Select Solana account and chain
      mockState.engine.backgroundState.AccountsController.internalAccounts.selectedAccount =
        solanaAccountId;
      mockState.engine.backgroundState.MultichainNetworkController.selectedMultichainNetworkChainId =
        SolScope.Mainnet;

      const result =
        selectSelectedAccountMultichainNetworkAggregatedBalance(mockState);

      // Should return undefined values since there are no Solana assets
      expect(result.totalNativeTokenBalance).toBeUndefined();
      expect(result.totalBalanceFiat).toBeUndefined();
      expect(result.tokenBalances).toEqual({
        [btcNativeAssetId]: { amount: '0.5', unit: 'BTC' },
      });
    });
  });

  describe('selectMultichainTokenListForAccountId', () => {
    const solanaAccountId = MOCK_SOLANA_ACCOUNT.id;
    const solNativeAssetId = MultichainNativeAssets.Solana;
    const solTokenAssetId: CaipAssetType = `${SolScope.Mainnet}/token:JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN`;
    const solDevnetAssetId = MultichainNativeAssets.SolanaDevnet;
    const btcNativeAssetId = MultichainNativeAssets.Bitcoin;

    const solMetadata = {
      name: 'Solana',
      symbol: 'SOL',
      fungible: true as const,
      iconUrl: 'https://example.com/sol.png',
      units: [{ name: 'Solana', symbol: 'SOL', decimals: 9 }],
    };
    const jupMetadata = {
      name: 'Jupiter',
      symbol: 'JUP',
      fungible: true as const,
      iconUrl: 'https://example.com/jup.png',
      units: [{ name: 'Jupiter', symbol: 'JUP', decimals: 6 }],
    };

    const buildState = ({
      assets = [solNativeAssetId, solTokenAssetId],
      balances = {
        [solNativeAssetId]: { amount: '10', unit: 'SOL' },
        [solTokenAssetId]: { amount: '20', unit: 'JUP' },
      },
      rates = {
        [solNativeAssetId]: { rate: '100', conversionTime: 0 },
        [solTokenAssetId]: { rate: '2', conversionTime: 0 },
      },
      metadata = {
        [solNativeAssetId]: solMetadata,
        [solTokenAssetId]: jupMetadata,
      },
    }: {
      assets?: CaipAssetType[];
      balances?: Record<string, { amount: string; unit: string }>;
      rates?: Record<string, { rate: string; conversionTime: number }>;
      metadata?: Record<string, unknown>;
    } = {}) => {
      const state = getNonEvmState(MOCK_SOLANA_ACCOUNT);
      const { backgroundState } = state.engine;
      backgroundState.MultichainAssetsController = {
        accountsAssets: { [solanaAccountId]: assets },
        assetsMetadata: metadata,
      } as unknown as typeof backgroundState.MultichainAssetsController;
      backgroundState.MultichainBalancesController.balances = {
        [solanaAccountId]: balances,
      };
      backgroundState.MultichainAssetsRatesController = {
        conversionRates: rates,
        historicalPrices: {},
      } as unknown as typeof backgroundState.MultichainAssetsRatesController;
      return state;
    };

    it('returns an empty array when no accountId is provided', () => {
      expect(
        selectMultichainTokenListForAccountId(buildState(), undefined),
      ).toStrictEqual([]);
    });

    it('returns an empty array when the account has no assets', () => {
      expect(
        selectMultichainTokenListForAccountId(
          buildState(),
          'unknown-account-id',
        ),
      ).toStrictEqual([]);
    });

    it('builds native and SPL tokens with fiat values from balance x rate', () => {
      const result = selectMultichainTokenListForAccountId(
        buildState(),
        solanaAccountId,
      );

      expect(result).toStrictEqual([
        {
          name: 'Solana',
          address: solNativeAssetId,
          symbol: 'SOL',
          image: 'https://example.com/sol.png',
          logo: 'https://example.com/sol.png',
          decimals: 9,
          chainId: SolScope.Mainnet,
          isNative: true,
          balance: '10',
          secondary: '1000',
          string: '',
          balanceFiat: '1000',
          isStakeable: false,
          aggregators: [],
          isETH: false,
          ticker: 'SOL',
        },
        {
          name: 'Jupiter',
          address: solTokenAssetId,
          symbol: 'JUP',
          image: 'https://example.com/jup.png',
          logo: 'https://example.com/jup.png',
          decimals: 6,
          chainId: SolScope.Mainnet,
          isNative: false,
          balance: '20',
          secondary: '40',
          string: '',
          balanceFiat: '40',
          isStakeable: false,
          aggregators: [],
          isETH: false,
          ticker: 'JUP',
        },
      ]);
    });

    it('excludes assets that belong to another CAIP chain', () => {
      const state = buildState({
        assets: [
          solNativeAssetId,
          solDevnetAssetId,
          btcNativeAssetId,
          solTokenAssetId,
        ],
        balances: {
          [solNativeAssetId]: { amount: '10', unit: 'SOL' },
          [solDevnetAssetId]: { amount: '5', unit: 'SOL' },
          [btcNativeAssetId]: { amount: '1', unit: 'BTC' },
          [solTokenAssetId]: { amount: '20', unit: 'JUP' },
        },
      });

      const result = selectMultichainTokenListForAccountId(
        state,
        solanaAccountId,
      );

      expect(result.map((token) => token.address)).toStrictEqual([
        solNativeAssetId,
        solTokenAssetId,
      ]);
      expect(result.every((token) => token.chainId === SolScope.Mainnet)).toBe(
        true,
      );
    });

    it('only returns assets for the selected non-EVM chain', () => {
      const state = buildState({
        assets: [solNativeAssetId, solDevnetAssetId],
        balances: {
          [solNativeAssetId]: { amount: '10', unit: 'SOL' },
          [solDevnetAssetId]: { amount: '5', unit: 'SOL' },
        },
        rates: {},
        metadata: {},
      });
      state.engine.backgroundState.MultichainNetworkController.selectedMultichainNetworkChainId =
        SolScope.Devnet;

      const result = selectMultichainTokenListForAccountId(
        state,
        solanaAccountId,
      );

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe(solDevnetAssetId);
      expect(result[0].chainId).toBe(SolScope.Devnet);
      expect(result[0].balance).toBe('5');
    });

    it('leaves balance and fiat values undefined when the balance is missing', () => {
      const state = buildState({
        balances: { [solTokenAssetId]: { amount: '20', unit: 'JUP' } },
      });

      const [nativeToken] = selectMultichainTokenListForAccountId(
        state,
        solanaAccountId,
      );

      expect(nativeToken.address).toBe(solNativeAssetId);
      expect(nativeToken.balance).toBeUndefined();
      expect(nativeToken.balanceFiat).toBeUndefined();
      expect(nativeToken.secondary).toBeUndefined();
    });

    it('returns a fiat value of 0 when the rate is missing', () => {
      const state = buildState({
        rates: { [solNativeAssetId]: { rate: '100', conversionTime: 0 } },
      });

      const [nativeToken, splToken] = selectMultichainTokenListForAccountId(
        state,
        solanaAccountId,
      );

      expect(nativeToken.balanceFiat).toBe('1000');
      expect(splToken.balance).toBe('20');
      expect(splToken.balanceFiat).toBe('0');
      expect(splToken.secondary).toBe('0');
      expect(splToken.balanceFiat).not.toBe('NaN');
    });

    it('falls back to the balance unit for name and symbol and 0 decimals when metadata is missing', () => {
      const state = buildState({
        metadata: { [solNativeAssetId]: solMetadata },
      });

      const [, splToken] = selectMultichainTokenListForAccountId(
        state,
        solanaAccountId,
      );

      expect(splToken).toMatchObject({
        name: 'JUP',
        symbol: 'JUP',
        ticker: 'JUP',
        decimals: 0,
        image: undefined,
        logo: undefined,
        isNative: false,
        balanceFiat: '40',
      });
    });

    it('falls back to empty name and symbol when both metadata and balance are missing', () => {
      const state = buildState({ balances: {}, metadata: {} });

      const [nativeToken] = selectMultichainTokenListForAccountId(
        state,
        solanaAccountId,
      );

      expect(nativeToken).toMatchObject({
        name: '',
        symbol: '',
        decimals: 0,
        balance: undefined,
        balanceFiat: undefined,
      });
    });

    it('defaults decimals to 0 when the metadata has no units', () => {
      const state = buildState({
        metadata: {
          [solNativeAssetId]: { ...solMetadata, units: [] },
          [solTokenAssetId]: jupMetadata,
        },
      });

      const [nativeToken, splToken] = selectMultichainTokenListForAccountId(
        state,
        solanaAccountId,
      );

      expect(nativeToken.decimals).toBe(0);
      expect(nativeToken.name).toBe('Solana');
      expect(splToken.decimals).toBe(6);
    });

    it('marks only slip44 assets as native', () => {
      const result = selectMultichainTokenListForAccountId(
        buildState(),
        solanaAccountId,
      );

      expect(
        result.map(({ address, isNative }) => ({ address, isNative })),
      ).toStrictEqual([
        { address: solNativeAssetId, isNative: true },
        { address: solTokenAssetId, isNative: false },
      ]);
    });
  });

  describe('selectMultichainNetworkAggregatedBalanceForAllAccounts', () => {
    it('returns the aggregated balance for every internal account on the selected chain', () => {
      const mockState = getNonEvmState(MOCK_SOLANA_ACCOUNT);
      const solanaAccountId = MOCK_SOLANA_ACCOUNT.id;
      const btcAccountId = MOCK_ACCOUNT_BIP122_P2WPKH.id;
      const btcTestnetAccountId = MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET.id;
      const solNativeAssetId = MultichainNativeAssets.Solana;
      const solTokenAssetId: CaipAssetType = `${SolScope.Mainnet}/token:JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN`;
      const btcNativeAssetId = MultichainNativeAssets.Bitcoin;

      mockState.engine.backgroundState.MultichainBalancesController.balances = {
        [solanaAccountId]: {
          [solNativeAssetId]: { amount: '10', unit: 'SOL' },
          [solTokenAssetId]: { amount: '20', unit: 'JUP' },
        },
        [btcAccountId]: {
          [btcNativeAssetId]: { amount: '0.5', unit: 'BTC' },
        },
      };
      mockState.engine.backgroundState.MultichainAssetsController.accountsAssets =
        {
          [solanaAccountId]: [solNativeAssetId, solTokenAssetId],
          [btcAccountId]: [btcNativeAssetId],
        };
      mockState.engine.backgroundState.MultichainAssetsRatesController.conversionRates =
        {
          [solNativeAssetId]: { rate: '100', conversionTime: 0 },
          [solTokenAssetId]: { rate: '2', conversionTime: 0 },
          [btcNativeAssetId]: { rate: '40000', conversionTime: 0 },
        };

      const result =
        selectMultichainNetworkAggregatedBalanceForAllAccounts(mockState);

      expect(Object.keys(result).sort()).toStrictEqual(
        [solanaAccountId, btcAccountId, btcTestnetAccountId].sort(),
      );
      expect(result[solanaAccountId]).toStrictEqual({
        totalNativeTokenBalance: { amount: '10', unit: 'SOL' },
        totalBalanceFiat: 1040,
        tokenBalances: {
          [solNativeAssetId]: { amount: '10', unit: 'SOL' },
          [solTokenAssetId]: { amount: '20', unit: 'JUP' },
        },
        fiatBalances: {
          [solNativeAssetId]: '1000',
          [solTokenAssetId]: '40',
        },
      });
      expect(result[btcAccountId]).toStrictEqual({
        totalNativeTokenBalance: undefined,
        totalBalanceFiat: undefined,
        tokenBalances: {
          [btcNativeAssetId]: { amount: '0.5', unit: 'BTC' },
        },
        fiatBalances: {},
      });
      expect(result[btcTestnetAccountId]).toStrictEqual({
        totalNativeTokenBalance: undefined,
        totalBalanceFiat: undefined,
        tokenBalances: {},
        fiatBalances: {},
      });
    });
  });

  describe('selectSolanaAccountTransactions', () => {
    it('returns transactions for the selected Solana account', () => {
      const state = getNonEvmState(MOCK_SOLANA_ACCOUNT);

      const mockTransactionData = {
        transactions: [
          {
            id: 'sol-tx-id',
            timestamp: 1733736433,
            chain: MultichainNativeAssets.Solana,
            status: 'confirmed' as const,
            type: 'send' as const,
            account: MOCK_SOLANA_ACCOUNT.id,
            from: [],
            to: [],
            fees: [],
            events: [],
          },
        ],
        next: null,
        lastUpdated: Date.now(),
      };

      state.engine.backgroundState.MultichainTransactionsController.nonEvmTransactions =
        {
          [MOCK_SOLANA_ACCOUNT.id]: mockTransactionData,
        };

      expect(selectSolanaAccountTransactions(state)).toEqual(
        mockTransactionData,
      );
    });

    it('returns empty array when no Solana account is selected', () => {
      const state = getEvmState();
      expect(selectSolanaAccountTransactions(state)).toEqual({
        lastUpdated: 0,
        next: null,
        transactions: [],
      });
    });

    it('returns empty array when Solana account has no transactions', () => {
      const state = getNonEvmState(MOCK_SOLANA_ACCOUNT);

      state.engine.backgroundState.MultichainTransactionsController.nonEvmTransactions =
        {};

      expect(selectSolanaAccountTransactions(state)).toEqual({
        lastUpdated: 0,
        next: null,
        transactions: [],
      });
    });
  });

  describe('selectMultichainHistoricalPrices', () => {
    const testAsset = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';

    it('returns empty object if no historical prices are available', () => {
      const state = getEvmState(undefined);
      state.engine.backgroundState.MultichainAssetsRatesController.historicalPrices =
        {};

      expect(selectMultichainHistoricalPrices(state)).toStrictEqual({});
    });

    it('Returns historical prices for a given asset', () => {
      const testCurrency = 'usd';
      const state = getEvmState(undefined);
      const mockHistoricalPricesForAsset = {
        [testCurrency]: {
          intervals: {},
          updateTime: 1737542312,
          expirationTime: 1737542312,
        },
      };
      state.engine.backgroundState.MultichainAssetsRatesController.historicalPrices =
        {
          [testAsset]: mockHistoricalPricesForAsset,
        };

      expect(selectMultichainHistoricalPrices(state)).toStrictEqual({
        [testAsset]: mockHistoricalPricesForAsset,
      });
    });
  });

  describe('makeSelectNonEvmAssetById', () => {
    const selectNonEvmAssetById = makeSelectNonEvmAssetById();
    const mockAccountId = MOCK_ACCOUNT_BIP122_P2WPKH.id;
    const mockAssetId = MultichainNativeAssets.Bitcoin;
    const mockRate = '25000.00';

    const mockState = getNonEvmState(MOCK_ACCOUNT_BIP122_P2WPKH, mockRate);

    it('should return undefined when EVM network is selected', () => {
      const evmState = getEvmState();
      const result = selectNonEvmAssetById(evmState, {
        accountId: mockAccountId,
        assetId: mockAssetId,
      });
      expect(result).toBeUndefined();
    });

    it('should throw error when accountId is not provided', () => {
      expect(() => {
        selectNonEvmAssetById(mockState, {
          accountId: undefined,
          assetId: mockAssetId,
        });
      }).toThrow('Account ID is required to fetch asset.');
    });

    it('should return asset with correct structure for native asset', () => {
      const result = selectNonEvmAssetById(mockState, {
        accountId: mockAccountId,
        assetId: mockAssetId,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('symbol', 'BTC');
      expect(result).toHaveProperty('address', mockAssetId);
      expect(result).toHaveProperty('chainId', BtcScope.Mainnet);
    });

    it('should handle missing balance gracefully', () => {
      const stateWithoutBalance = {
        ...mockState,
        engine: {
          ...mockState.engine,
          backgroundState: {
            ...mockState.engine.backgroundState,
            MultichainBalancesController: {
              balances: {},
            },
          },
        },
      } as unknown as RootState;

      const result = selectNonEvmAssetById(stateWithoutBalance, {
        accountId: mockAccountId,
        assetId: mockAssetId,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('balance', undefined);
      expect(result).toHaveProperty('balanceFiat', undefined);
    });

    it('should handle missing metadata gracefully', () => {
      const stateWithoutMetadata = {
        ...mockState,
        engine: {
          ...mockState.engine,
          backgroundState: {
            ...mockState.engine.backgroundState,
            MultichainAssetsController: {
              assetsMetadata: {},
            },
          },
        },
      } as unknown as RootState;

      const result = selectNonEvmAssetById(stateWithoutMetadata, {
        accountId: mockAccountId,
        assetId: mockAssetId,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('name', 'BTC');
      expect(result).toHaveProperty('symbol', 'BTC');
      expect(result).toHaveProperty('decimals', 0);
    });

    it('should handle missing rates gracefully', () => {
      const stateWithoutRates = {
        ...mockState,
        engine: {
          ...mockState.engine,
          backgroundState: {
            ...mockState.engine.backgroundState,
            MultichainAssetsRatesController: {
              assetsRates: {},
            },
          },
        },
      } as unknown as RootState;

      const result = selectNonEvmAssetById(stateWithoutRates, {
        accountId: mockAccountId,
        assetId: mockAssetId,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('balanceFiat', '0');
    });
  });
});
