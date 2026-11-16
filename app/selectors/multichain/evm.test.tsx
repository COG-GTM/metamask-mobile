import React from 'react';
import { Text } from 'react-native';
import { RootState } from '../../reducers';
import {
  selectedAccountNativeTokenCachedBalanceByChainId,
  selectAccountTokensAcrossChains,
  selectNativeEvmAsset,
  selectStakedEvmAsset,
  selectEvmTokens,
  selectEvmTokensWithZeroBalanceFilter,
  makeSelectAssetByAddressAndChainId,
  selectEvmTokenFiatBalances,
  selectEvmTokenMarketData,
  selectNativeTokensAcrossChains,
  selectNativeTokensAcrossChainsForAddress,
} from './evm';
import { TokenI } from '../../components/UI/Tokens/types';
import { SolScope } from '@metamask/keyring-api';
import { GetByQuery } from '@testing-library/react-native/build/queries/make-queries';
import {
  TextMatch,
  TextMatchOptions,
} from '@testing-library/react-native/build/matches';
import { CommonQueryOptions } from '@testing-library/react-native/build/queries/options';
import { Store } from 'redux';
import { useSelector } from 'react-redux';
import renderWithProvider from '../../util/test/renderWithProvider';
import Engine, { EngineState } from '../../core/Engine';
import { act } from '@testing-library/react-native';
import {
  AccountTrackerController,
  TokensController,
} from '@metamask/assets-controllers';
import {
  ETH_CHAIN_ID,
  POLYGON_CHAIN_ID,
} from '@metamask/swaps-controller/dist/constants';
import { AccountsControllerState } from '@metamask/accounts-controller';
import { zeroAddress } from 'ethereumjs-util';

describe('Multichain Selectors', () => {
  const mockState: RootState = {
    engine: {
      backgroundState: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              name: 'Ethereum Mainnet',
              nativeCurrency: 'ETH',
              rpcEndpoints: [{ networkClientId: '0x1' }],
            },
            '0x89': {
              chainId: '0x89',
              name: 'Polygon',
              nativeCurrency: 'POL',
              rpcEndpoints: [{ networkClientId: '0x89' }],
            },
          },
        },
        AccountTrackerController: {
          accountsByChainId: {
            '0x1': {
              '0xAddress1': {
                balance: '0x1',
                stakedBalance: '0x2',
              },
            },
            '0x89': {
              '0xAddress1': {
                balance: '0x3',
                stakedBalance: '0x0',
              },
            },
          },
        },
        TokensController: {
          allTokens: {
            '0x1': {
              '0xAddress1': [
                {
                  address: '0xToken1',
                  symbol: 'TK1',
                  decimals: 18,
                  balance: '1000000000000000000',
                },
              ],
            },
          },
        },
        TokenBalancesController: {
          tokenBalances: {
            '0xAddress1': {
              '0x1': {
                '0xToken1': '0x1',
              },
            },
          },
        },
        TokenRatesController: {
          marketData: {
            '0x1': {
              '0xToken1': { price: 100 },
            },
          },
        },
        CurrencyRateController: {
          currentCurrency: 'USD',
          currencyRates: {
            ETH: {
              conversionRate: 2000,
            },
            POL: {
              conversionRate: 1,
            },
          },
        },
        AccountsController: {
          internalAccounts: {
            selectedAccount: '0xAddress1',
            accounts: {
              '0xAddress1': {
                address: '0xAddress1',
              },
            },
          },
        },
        MultichainNetworkController: {
          multichainNetworkConfigurationsByChainId: {
            [SolScope.Mainnet]: {
              chainId: SolScope.Mainnet,
            },
          },

          isEvmSelected: true,
          selectedMultichainNetworkChainId: SolScope.Mainnet,
        },
        PreferencesController: {
          tokenNetworkFilter: {
            '0x1': true,
            '0x89': true,
          },
        },
      },
    },
    settings: {
      showFiatOnTestnets: true,
    },
  } as unknown as RootState;

  describe('selectedAccountNativeTokenCachedBalanceByChainId', () => {
    it('should return native token balances for all chains', () => {
      const result =
        selectedAccountNativeTokenCachedBalanceByChainId(mockState);
      expect(result).toEqual({
        '0x1': {
          balance: '0x1',
          stakedBalance: '0x2',
          isStaked: true,
          name: '',
        },
        '0x89': {
          balance: '0x3',
          stakedBalance: '0x0',
          isStaked: false,
          name: '',
        },
      });
    });

    it('should return empty object when no account is selected', () => {
      const stateWithoutAccount = {
        ...mockState,
        engine: {
          ...mockState.engine,
          backgroundState: {
            ...mockState.engine.backgroundState,
            AccountsController: {
              internalAccounts: {
                selectedAccount: undefined,
                accounts: {},
              },
            },
          },
        },
      } as unknown as RootState;

      const result =
        selectedAccountNativeTokenCachedBalanceByChainId(stateWithoutAccount);
      expect(result).toEqual({});
    });
  });

  describe('selectAccountTokensAcrossChains', () => {
    it('should return tokens across all chains for selected account', () => {
      const result = selectAccountTokensAcrossChains(mockState);
      expect(result).toHaveProperty('0x1');

      const chain1Tokens = result['0x1'] || [];
      expect(chain1Tokens.length).toBeGreaterThan(0);

      const ethToken = chain1Tokens.find(
        (token) => token.symbol === 'Ethereum' && !token.isStaked,
      );
      expect(ethToken).toBeDefined();
      expect(ethToken?.isNative).toBe(true);
      expect(ethToken?.isETH).toBe(true);

      const stakedEthToken = chain1Tokens.find(
        (token) => token.symbol === 'Ethereum' && token.isStaked,
      );
      expect(stakedEthToken).toBeDefined();
      expect(stakedEthToken?.isNative).toBe(true);
      expect(stakedEthToken?.isStaked).toBe(true);

      const tk1Token = chain1Tokens.find((token) => token.symbol === 'TK1');
      expect(tk1Token).toBeDefined();
      expect(tk1Token?.isNative).toBe(false);
    });

    it('should handle multiple chains correctly', () => {
      const result = selectAccountTokensAcrossChains(mockState);
      expect(result).toHaveProperty('0x89');
      const polygonTokens = result['0x89'];
      expect(polygonTokens.length).toBeGreaterThan(0);
      expect(polygonTokens.some((token) => token.symbol === 'POL')).toBe(true);
    });
  });

  describe('selectNativeEvmAsset', () => {
    const testState: RootState = {
      engine: {
        backgroundState: {
          ...mockState.engine.backgroundState,
          AccountTrackerController: {
            accountsByChainId: {},
          },
          NetworkController: {
            ...mockState.engine.backgroundState.NetworkController,
            selectedNetworkClientId: '0x1',
          },
          AccountsController: {
            internalAccounts: {
              selectedAccount: '',
              accounts: {},
            },
          },
        },
      },
      settings: {
        showFiatOnTestnets: true,
      },
    } as unknown as RootState;
    it('should return undefined if accountBalanceByChainId is not provided', () => {
      const result = selectNativeEvmAsset(testState);
      expect(result).toBeUndefined();
    });

    it('should return the correct native EVM asset structure', () => {
      const result = selectNativeEvmAsset(mockState);

      expect(result).toEqual({
        decimals: 18,
        name: 'Ethereum',
        symbol: 'ETH',
        isETH: true,
        balance: '< 0.00001',
        balanceFiat: '$0',
        logo: '../images/eth-logo-new.png',
        address: zeroAddress(),
      });
    });

    it('should return asset name as ticker if not ETH', () => {
      const testStateOverride = {
        ...testState,
        engine: {
          backgroundState: {
            ...mockState.engine.backgroundState,
            NetworkController: {
              ...mockState.engine.backgroundState.NetworkController,
              selectedNetworkClientId: '0x89',
            },
          },
        },
      } as unknown as RootState;
      const result = selectNativeEvmAsset(testStateOverride);

      expect(result).toEqual({
        decimals: 18,
        name: 'POL',
        symbol: 'POL',
        isETH: true,
        balance: '< 0.00001',
        balanceFiat: '$0',
        logo: '../images/eth-logo-new.png',
        address: zeroAddress(),
      });
    });
  });

  describe('selectStakedEvmAsset', () => {
    it('should return undefined if accountBalanceByChainId is not provided', () => {
      const testState: RootState = {
        engine: {
          backgroundState: {
            ...mockState.engine.backgroundState,
            AccountTrackerController: {
              accountsByChainId: {},
            },
            AccountsController: {
              internalAccounts: {
                selectedAccount: '',
                accounts: {},
              },
            },
          },
        },
        settings: {
          showFiatOnTestnets: true,
        },
      } as unknown as RootState;

      const result = selectStakedEvmAsset(testState);
      expect(result).toBeUndefined();
    });

    it('should return undefined if stakedBalance is missing', () => {
      const testState: RootState = {
        ...mockState,
        engine: {
          backgroundState: {
            ...mockState.engine.backgroundState,
            AccountTrackerController: {
              accountsByChainId: {
                '0x1': {
                  balance: '0x1', // 1 ETH
                },
              },
            },
          },
        },
      } as unknown as RootState;

      const result = selectStakedEvmAsset(testState);
      expect(result).toBeUndefined();
    });

    it('should return undefined if stakedBalance is zero', () => {
      const testState: RootState = {
        ...mockState,
        engine: {
          backgroundState: {
            ...mockState.engine.backgroundState,
            AccountTrackerController: {
              accountsByChainId: {
                '0x1': {
                  balance: '0x1',
                  stakedBalance: '0x2',
                },
              },
            },
          },
        },
      } as unknown as RootState;

      const result = selectStakedEvmAsset(testState);
      expect(result).toBeUndefined();
    });

    it('should return undefined if nativeAsset is missing', () => {
      const testState: RootState = {
        ...mockState,
        engine: {
          backgroundState: {
            ...mockState.engine.backgroundState,
            AccountTrackerController: {
              accountsByChainId: {
                '0x1': {
                  balance: '0x1',
                  stakedBalance: '0x2',
                },
              },
            },
          },
        },
      } as unknown as RootState;

      const result = selectStakedEvmAsset(testState);
      expect(result).toBeUndefined();
    });

    it('should return the correct staked EVM asset structure', () => {
      const result = selectStakedEvmAsset(mockState);

      expect(result).toEqual({
        decimals: 18,
        name: 'Staked Ethereum',
        symbol: 'ETH',
        isETH: true,
        isStaked: true,
        balance: '< 0.00001',
        balanceFiat: '$0',
        logo: '../images/eth-logo-new.png',
        address: zeroAddress(),
      });
    });
  });

  describe('selectEvmTokensWithZeroBalanceFilter', () => {
    it('should return the same memoized reference, when called with the same state', () => {
      const result1 = selectEvmTokensWithZeroBalanceFilter(mockState);
      const result2 = selectEvmTokensWithZeroBalanceFilter(mockState);
      expect(result1 === result2).toBe(true);
    });

    it('should return all tokens when hideZeroBalanceTokens is false', () => {
      const testState = {
        ...mockState,
        settings: { ...mockState.settings, hideZeroBalanceTokens: false },
      } as unknown as RootState;

      const result = selectEvmTokensWithZeroBalanceFilter(testState);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0); // Ensure all tokens are returned
    });

    it('should filter out zero balance tokens when hideZeroBalanceTokens is true', () => {
      const testState = {
        ...mockState,
        settings: { ...mockState.settings, hideZeroBalanceTokens: true },
        engine: {
          ...mockState.engine,
          backgroundState: {
            ...mockState.engine.backgroundState,
            AccountTrackerController: {
              accountsByChainId: {
                '0x1': {
                  '0xAddress1': {
                    balance: '0x0',
                    stakedBalance: '0x0',
                  },
                },
              },
            },
            TokenBalancesController: {
              tokenBalances: {
                '0xAddress1': {
                  '0x1': {
                    '0xToken1': '0x0', // Simulating zero balance token
                  },
                },
              },
            },
          },
        },
      } as unknown as RootState;

      const result = selectEvmTokensWithZeroBalanceFilter(testState);

      expect(result).toBeDefined();
      expect(result.length).toBe(0); // Should remove all tokens with zero balance
    });

    it('should keep native tokens when on current network, even if zero balance', () => {
      const testState = {
        ...mockState,
        settings: { ...mockState.settings, hideZeroBalanceTokens: true },
        engine: {
          ...mockState.engine,
          backgroundState: {
            ...mockState.engine.backgroundState,
            AccountTrackerController: {
              accountsByChainId: {
                '0x1': {
                  '0xAddress1': {
                    balance: '0x0',
                    stakedBalance: '0x0', // simulating a staked balance
                  },
                },
              },
            },
            TokenBalancesController: {
              tokenBalances: {
                '0xAddress1': {
                  '0x1': {
                    '0xToken1': '0x0',
                  },
                },
              },
            },
            PreferencesController: {
              tokenNetworkFilter: {
                '0x1': true, // user is on "current network" filter, since NetworkController has multiple networks, and we are only filtering to one chain here
              },
            },
          },
        },
      } as unknown as RootState;

      const result = selectEvmTokensWithZeroBalanceFilter(testState);

      expect(result).toBeDefined();
      expect(result.every((token) => token.isNative === true)).toBeTruthy();
      expect(result.every((token) => token.balance === '0')).toBeTruthy();
      expect(result.length).toBe(2); // Native tokens should remain
    });
  });

  describe('selectEvmTokens', () => {
    it('should return the same memoized reference, when called with the same state', () => {
      const result1 = selectEvmTokens(mockState);
      const result2 = selectEvmTokens(mockState);
      expect(result1 === result2).toBe(true);
    });

    it('should return all tokens when hideZeroBalanceTokens is false', () => {
      const result = selectEvmTokens(mockState);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter out zero balance tokens when hideZeroBalanceTokens is true', () => {
      const testState = {
        ...mockState,
        settings: { ...mockState.settings, hideZeroBalanceTokens: true },
        engine: {
          ...mockState.engine,
          backgroundState: {
            ...mockState.engine.backgroundState,
            AccountTrackerController: {
              accountsByChainId: {
                '0x1': {
                  '0xAddress1': {
                    balance: '0x0',
                    stakedBalance: '0x0',
                  },
                },
              },
            },
            TokenBalancesController: {
              tokenBalances: {
                '0xAddress1': {
                  '0x1': {
                    '0xToken1': '0x0',
                  },
                },
              },
            },
          },
        },
      } as unknown as RootState;

      const result = selectEvmTokens(testState);
      expect(result).toBeDefined();
      expect(result.length).toBe(0); // All tokens have zero balance, so none should be returned
    });

    it('when on current network, should filter out zero balance tokens except native and staking tokens when hideZeroBalanceTokens is true', () => {
      const testState = {
        ...mockState,
        settings: { ...mockState.settings, hideZeroBalanceTokens: true },
        engine: {
          ...mockState.engine,
          backgroundState: {
            ...mockState.engine.backgroundState,
            AccountTrackerController: {
              accountsByChainId: {
                '0x1': {
                  '0xAddress1': {
                    balance: '0x0',
                    stakedBalance: '0x2', // simulating a staked balance
                  },
                },
              },
            },
            TokenBalancesController: {
              tokenBalances: {
                '0xAddress1': {
                  '0x1': {
                    '0xToken1': '0x0',
                  },
                },
              },
            },
            PreferencesController: {
              tokenNetworkFilter: {
                '0x1': true, // user is on "current network" filter, since NetworkController has multiple networks, and we are only filtering to one chain here
              },
            },
          },
        },
      } as unknown as RootState;

      const result = selectEvmTokens(testState);
      expect(result).toBeDefined();
      expect(result.length).toBe(2); // All tokens have zero balance, so none should be returned, however on current network view, we still want to show native token and staked token, even if zero
    });

    it('should return tokens only for the selected network if not on all networks', () => {
      const testState = {
        ...mockState,
        settings: { ...mockState.settings, hideZeroBalanceTokens: true },
        engine: {
          ...mockState.engine,
          backgroundState: {
            ...mockState.engine.backgroundState,
            NetworkController: {
              networkConfigurationsByChainId: {
                '0x1': {
                  chainId: '0x1',
                  name: 'Ethereum Mainnet',
                  nativeCurrency: 'ETH',
                  rpcEndpoints: [{ networkClientId: '0x1' }],
                },
                '0x89': {
                  chainId: '0x89',
                  name: 'Polygon',
                  nativeCurrency: 'POL',
                  rpcEndpoints: [{ networkClientId: '0x89' }],
                },
              },
              selectedNetworkClientId: '0x89',
            },
            PreferencesController: {
              tokenNetworkFilter: {
                '0x89': true, // user only wants to see tokens on Polygon
              },
            },
          },
        },
      } as unknown as RootState;

      const result = selectEvmTokens(testState);
      expect(result).toBeDefined();
      expect(result.every((token) => token.chainId === '0x89')).toBeTruthy();
    });

    it('should return only tokens from popular EVM networks when selected', () => {
      const testState = {
        ...mockState,
        engine: {
          ...mockState.engine,
          backgroundState: {
            ...mockState.engine.backgroundState,
            TokensController: {
              allTokens: {
                // chain not in popular networks
                '0x99': {
                  '0xAddress1': [
                    {
                      address: '0xUnpopularToken',
                      symbol: 'TKN9',
                      decimals: 18,
                    },
                  ],
                },
              },
            },
          },
        },
      } as unknown as RootState;

      const result = selectEvmTokens(testState);
      expect(result).toBeDefined();
      expect(result.some((token) => token.chainId === '0x99')).toBeFalsy();
      expect(
        result.every(
          (token) => token.chainId === '0x89' || token.chainId === '0x1',
        ),
      ).toBeTruthy();
    });

    it('should categorize native and non-native tokens correctly', () => {
      const result = selectEvmTokens(mockState);

      const nativeTokens = result.filter((token) => token.isNative);
      const nonNativeTokens = result.filter((token) => !token.isNative);

      expect(nativeTokens.length).toBeGreaterThan(0);
      expect(nonNativeTokens.length).toBeGreaterThan(0);
    });

    it('should filter out testnet tokens if the all networks filter is selected', () => {
      const testState = {
        ...mockState,
        engine: {
          ...mockState.engine,
          backgroundState: {
            ...mockState.engine.backgroundState,
            TokensController: {
              allTokens: {
                // sepolia
                '0xaa36a7': {
                  '0xAddress1': [
                    {
                      address: '0xTestnetToken',
                      symbol: 'TEST1',
                      decimals: 18,
                    },
                  ],
                },
              },
            },
          },
        },
      } as unknown as RootState;

      const result = selectEvmTokens(testState);
      expect(result).toBeDefined();
      expect(
        result.find((token) => token.chainId === '0xaa36a7'),
      ).toBeUndefined();
    });

    it('should render native and staked assets in state when no erc20 tokens are present', () => {
      const nativeAndStakedTestState = {
        ...mockState,
        engine: {
          backgroundState: {
            ...mockState.engine.backgroundState,
            TokensController: {
              allTokens: {},
            },
            AccountTrackerController: {
              accountsByChainId: {
                [ETH_CHAIN_ID]: {
                  '0xAddress1': {
                    balance: '0x1',
                    stakedBalance: '0x2',
                  },
                },
              },
            },
          },
        },
      } as unknown as RootState;

      const result = selectEvmTokens(nativeAndStakedTestState);
      expect(result).toBeDefined();
      expect(result.length).toBe(3);

      // Check for Staked Ethereum
      const stakedEth = result.find(
        (token) => token.isStaked && token.chainId === ETH_CHAIN_ID,
      );
      expect(stakedEth).toBeDefined();
      expect(stakedEth?.chainId).toBe(ETH_CHAIN_ID);
      expect(stakedEth?.name).toBe('Staked Ethereum');

      // Check for Native Ethereum
      const nativeEth = result.find(
        (token) => !token.isStaked && token.chainId === ETH_CHAIN_ID,
      );
      expect(nativeEth).toBeDefined();
      expect(nativeEth?.chainId).toBe(ETH_CHAIN_ID);
      expect(nativeEth?.name).toBe('Ethereum');

      // Check for Native Polygon
      const nativePol = result.find(
        (token) => !token.isStaked && token.chainId === POLYGON_CHAIN_ID,
      );
      expect(nativePol).toBeDefined();
      expect(nativePol?.chainId).toBe(POLYGON_CHAIN_ID);
      expect(nativePol?.name).toBe('POL');
    });
  });

  describe('fiat and market data selectors', () => {
    const ACCOUNT_ADDRESS = '0x2990079bcdEe240329a520d2444386FC119da21a';
    const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const TWO_ETH_WEI = '0x1bc16d674ec80000';
    const ONE_ETH_WEI = '0xde0b6b3a7640000';
    const TEN_POL_WEI = '0x8ac7230489e80000';
    const THREE_USDC = '0x2dc6c0';

    const buildFiatState = (
      accountsByChainId: Record<
        string,
        Record<string, { balance: string; stakedBalance?: string }>
      > = {
        '0x1': {
          [ACCOUNT_ADDRESS]: {
            balance: TWO_ETH_WEI,
            stakedBalance: ONE_ETH_WEI,
          },
        },
        '0x89': {
          [ACCOUNT_ADDRESS]: { balance: TEN_POL_WEI, stakedBalance: '0x0' },
        },
      },
    ): RootState =>
      ({
        ...mockState,
        engine: {
          backgroundState: {
            ...mockState.engine.backgroundState,
            NetworkController: {
              ...mockState.engine.backgroundState.NetworkController,
              selectedNetworkClientId: '0x1',
            },
            AccountTrackerController: { accountsByChainId },
            TokensController: {
              allTokens: {
                '0x1': {
                  [ACCOUNT_ADDRESS]: [
                    {
                      address: USDC_ADDRESS,
                      symbol: 'USDC',
                      name: 'USD Coin',
                      decimals: 6,
                    },
                  ],
                },
              },
            },
            TokenBalancesController: {
              tokenBalances: {
                [ACCOUNT_ADDRESS]: { '0x1': { [USDC_ADDRESS]: THREE_USDC } },
              },
            },
            TokenRatesController: {
              marketData: {
                '0x1': {
                  [USDC_ADDRESS]: { price: 0.0005 },
                  [zeroAddress()]: { price: 1 },
                },
              },
            },
            CurrencyRateController: {
              currentCurrency: 'USD',
              currencyRates: {
                ETH: { conversionRate: 2000 },
                POL: { conversionRate: 0.5 },
              },
            },
            AccountsController: {
              internalAccounts: {
                selectedAccount: 'account-1',
                accounts: {
                  'account-1': { id: 'account-1', address: ACCOUNT_ADDRESS },
                },
              },
            },
            TokenListController: {
              tokensChainsCache: {
                '0x1': {
                  data: {
                    [USDC_ADDRESS.toLowerCase()]: {
                      address: USDC_ADDRESS.toLowerCase(),
                      symbol: 'USDC',
                      name: 'USD Coin',
                      decimals: 6,
                    },
                  },
                },
              },
            },
          },
        },
      } as unknown as RootState);

    describe('selectNativeTokensAcrossChainsForAddress', () => {
      it('converts native and staked balances to fiat with the chain conversion rate', () => {
        const result = selectNativeTokensAcrossChainsForAddress(
          buildFiatState(),
          ACCOUNT_ADDRESS,
        );

        expect(result['0x1']).toHaveLength(2);
        const [eth, stakedEth] = result['0x1'];
        expect(eth).toMatchObject({
          name: 'Ethereum',
          balance: '2',
          balanceFiat: '$4000',
          isStaked: false,
          ticker: 'ETH',
        });
        expect(stakedEth).toMatchObject({
          name: 'Staked Ethereum',
          balance: '1',
          balanceFiat: '$2000',
          isStaked: true,
        });

        expect(result['0x89']).toHaveLength(1);
        expect(result['0x89'][0]).toMatchObject({
          name: 'POL',
          balance: '10',
          balanceFiat: '$5',
          isStaked: false,
        });
      });

      it.each(['0x0', '0x00'])(
        'does not add a staked entry when stakedBalance is %s',
        (stakedBalance) => {
          const state = buildFiatState({
            '0x1': {
              [ACCOUNT_ADDRESS]: { balance: TWO_ETH_WEI, stakedBalance },
            },
          });

          const result = selectNativeTokensAcrossChainsForAddress(
            state,
            ACCOUNT_ADDRESS,
          );

          expect(result['0x1']).toHaveLength(1);
          expect(result['0x1'][0].isStaked).toBe(false);
        },
      );

      it('does not add a staked entry when the account is not staked', () => {
        const state = buildFiatState({
          '0x1': { [ACCOUNT_ADDRESS]: { balance: TWO_ETH_WEI } },
        });

        const result = selectNativeTokensAcrossChainsForAddress(
          state,
          ACCOUNT_ADDRESS,
        );

        expect(result['0x1']).toHaveLength(1);
        expect(result['0x1'].some((token) => token.isStaked)).toBe(false);
      });
    });

    describe('selectNativeTokensAcrossChains', () => {
      it('returns native tokens for the selected account', () => {
        const state = buildFiatState();
        expect(selectNativeTokensAcrossChains(state)).toEqual(
          selectNativeTokensAcrossChainsForAddress(state, ACCOUNT_ADDRESS),
        );
      });
    });

    describe('selectAccountTokensAcrossChains balanceFiat', () => {
      it('exposes the computed native and staked fiat balances', () => {
        const result = selectAccountTokensAcrossChains(buildFiatState());

        expect(
          result['0x1'].map((token) => [
            token.symbol,
            (token as TokenI).balanceFiat,
          ]),
        ).toEqual([
          ['Ethereum', '$4000'],
          ['Ethereum', '$2000'],
          ['USDC', ''],
        ]);
      });
    });

    describe('selectEvmTokenFiatBalances', () => {
      it('computes native, staked and ERC20 fiat values in selectEvmTokens order', () => {
        const state = buildFiatState();
        const tokens = selectEvmTokens(state);
        const fiatBalances = selectEvmTokenFiatBalances(state);

        expect(
          tokens.map((token) => [token.chainId, token.symbol, token.isStaked]),
        ).toEqual([
          ['0x1', 'Ethereum', false],
          ['0x1', 'Ethereum', true],
          ['0x89', 'POL', false],
          ['0x1', 'USDC', false],
        ]);
        // ETH: 2 * 2000, staked ETH: 1 * 2000, POL: 10 * 0.5,
        // USDC: 3 tokens * 0.0005 ETH price * 2000 USD/ETH
        expect(fiatBalances).toEqual([4000, 2000, 5, 3]);
      });

      it('falls back to a zero conversion rate when the native currency has no rate', () => {
        const state = buildFiatState();
        const noRatesState = {
          ...state,
          engine: {
            backgroundState: {
              ...state.engine.backgroundState,
              CurrencyRateController: {
                currentCurrency: 'USD',
                currencyRates: {},
              },
            },
          },
        } as unknown as RootState;

        const fiatBalances = selectEvmTokenFiatBalances(noRatesState);

        expect(fiatBalances.slice(0, 3)).toEqual([0, 0, 0]);
        expect(fiatBalances[3]).toBeUndefined();
      });

      it('throws when a token chain has no network configuration', () => {
        expect(() =>
          selectEvmTokenFiatBalances.resultFunc(
            [
              {
                chainId: '0x999',
                isNative: true,
                balance: '1',
              } as unknown as TokenI,
            ],
            {},
            {},
            ACCOUNT_ADDRESS,
            {},
            {},
            'usd',
          ),
        ).toThrow(TypeError);
      });
    });

    describe('selectEvmTokenMarketData', () => {
      it('returns the zero address market data entry for a native token', () => {
        expect(
          selectEvmTokenMarketData(buildFiatState(), { chainId: '0x1' }),
        ).toEqual({ price: 1 });
      });

      it('returns metadata and market data for a lowercase token address', () => {
        expect(
          selectEvmTokenMarketData(buildFiatState(), {
            chainId: '0x1',
            tokenAddress: USDC_ADDRESS.toLowerCase(),
          }),
        ).toEqual({
          metadata: {
            address: USDC_ADDRESS.toLowerCase(),
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
          },
          marketData: { price: 0.0005 },
        });
      });

      it('returns undefined market data for a token without rates on the requested chain', () => {
        // Metadata comes from the token list of the selected EVM chain,
        // not params.chainId.
        expect(
          selectEvmTokenMarketData(buildFiatState(), {
            chainId: '0x89',
            tokenAddress: USDC_ADDRESS,
          }),
        ).toEqual({
          metadata: expect.objectContaining({ symbol: 'USDC' }),
          marketData: undefined,
        });
      });

      it('throws for a non-hex token address', () => {
        // safeToChecksumAddress throws on non-hex input, so the
        // `return null` branch is not reached for invalid addresses.
        expect(() =>
          selectEvmTokenMarketData(buildFiatState(), {
            chainId: '0x1',
            tokenAddress: 'not-an-address',
          }),
        ).toThrow('This method only supports 0x-prefixed hex strings');
      });
    });
  });

  describe('makeSelectAssetByAddressAndChainId', () => {
    const mockAccountId = '0xAddress1';
    const mockAllTokens = {
      [ETH_CHAIN_ID]: {
        [mockAccountId]: [
          {
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            symbol: 'USDC',
            decimals: 6,
            name: 'USDC',
          },
          {
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            symbol: 'DAI',
            decimals: 18,
            name: 'Dai Stablecoin',
          },
        ],
      },
      [POLYGON_CHAIN_ID]: {
        [mockAccountId]: [
          {
            address: '0x0D1E753a25eBda689453309112904807625bEFBe',
            symbol: 'CAKE',
            decimals: 18,
            image:
              'https://static.cx.metamask.io/api/v1/tokenIcons/59144/0x0d1e753a25ebda689453309112904807625befbe.png',
            aggregators: ['CoinGecko', 'Lifi', 'Rubic'],
          },
        ],
      },
    };

    const testState: RootState = {
      ...mockState,
      engine: {
        ...mockState.engine,
        backgroundState: {
          ...mockState.engine.backgroundState,
          MultichainNetworkController: {
            ...mockState.engine.backgroundState.MultichainNetworkController,
            isEvmSelected: true,
          },
          TokensController: {
            allTokens: mockAllTokens,
          },
        },
      },
    } as unknown as RootState;

    it('should return undefined when EVM network is not selected', () => {
      const stateWithNonEvmNetwork = {
        ...testState,
        engine: {
          ...testState.engine,
          backgroundState: {
            ...testState.engine.backgroundState,
            MultichainNetworkController: {
              ...testState.engine.backgroundState.MultichainNetworkController,
              isEvmSelected: false,
            },
          },
        },
      } as unknown as RootState;

      const selector = makeSelectAssetByAddressAndChainId();
      const result = selector(stateWithNonEvmNetwork, {
        address: '0x123',
        chainId: '0x1',
      });

      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existent token', () => {
      const selector = makeSelectAssetByAddressAndChainId();
      const result = selector(testState, {
        address: '0x999',
        chainId: '0x1',
      });

      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existent chain', () => {
      const selector = makeSelectAssetByAddressAndChainId();
      const result = selector(testState, {
        address: '0x123',
        chainId: '0x999',
      });

      expect(result).toBeUndefined();
    });

    it('should return the correct token for valid address and chainId', () => {
      const selector = makeSelectAssetByAddressAndChainId();
      const result = selector(testState, {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        chainId: '0x1',
      });

      expect(result).toHaveProperty(
        'address',
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      );
      expect(result).toHaveProperty('chainId', '0x1');
      expect(result).toHaveProperty('symbol', 'USDC');
    });

    it('should handle different chain IDs correctly', () => {
      const selector = makeSelectAssetByAddressAndChainId();
      const result = selector(testState, {
        address: '0x0D1E753a25eBda689453309112904807625bEFBe',
        chainId: POLYGON_CHAIN_ID,
      });

      expect(result).toHaveProperty(
        'address',
        '0x0D1E753a25eBda689453309112904807625bEFBe',
      );
      expect(result).toHaveProperty('chainId', POLYGON_CHAIN_ID);
      expect(result).toHaveProperty('symbol', 'CAKE');
      expect(result).toHaveProperty('aggregators', [
        'CoinGecko',
        'Lifi',
        'Rubic',
      ]);
    });

    it('should handle non-native tokens correctly', () => {
      const selector = makeSelectAssetByAddressAndChainId();
      const result = selector(testState, {
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        chainId: ETH_CHAIN_ID,
      });

      expect(result).toHaveProperty(
        'address',
        '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      );
      expect(result).toHaveProperty('chainId', ETH_CHAIN_ID);
      expect(result).toHaveProperty('symbol', 'DAI');
      expect(result).toHaveProperty('name', 'Dai Stablecoin');
    });

    it('should handle case-insensitive address matching', () => {
      const selector = makeSelectAssetByAddressAndChainId();
      const result = selector(testState, {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // Different case
        chainId: ETH_CHAIN_ID,
      });

      expect(result).toHaveProperty(
        'address',
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      );
      expect(result).toHaveProperty('chainId', ETH_CHAIN_ID);
      expect(result).toHaveProperty('symbol', 'USDC');
      expect(result).toHaveProperty('name', 'USDC');
    });
  });
});

const mockAccountId = '0xAddress1';

const mockAllTokens = {
  [ETH_CHAIN_ID]: {
    [mockAccountId]: [
      {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        decimals: 6,
        name: 'USDC',
      },
      {
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        symbol: 'DAI',
        decimals: 18,
        name: 'Dai Stablecoin',
      },
    ],
  },
  [POLYGON_CHAIN_ID]: {
    [mockAccountId]: [
      {
        address: '0x0D1E753a25eBda689453309112904807625bEFBe',
        symbol: 'CAKE',
        decimals: 18,
        image:
          'https://static.cx.metamask.io/api/v1/tokenIcons/59144/0x0d1e753a25ebda689453309112904807625befbe.png',
        aggregators: ['CoinGecko', 'Lifi', 'Rubic'],
      },
    ],
  },
};

const mockNetworkConfigurationsByChainId = {
  [ETH_CHAIN_ID]: {
    chainId: ETH_CHAIN_ID,
    name: 'Ethereum Mainnet',
    nativeCurrency: 'ETH',
  },
  [POLYGON_CHAIN_ID]: {
    chainId: POLYGON_CHAIN_ID,
    name: 'Polygon',
    nativeCurrency: 'POL',
  },
};

const mockAccountsByChainId = {
  [ETH_CHAIN_ID]: {
    [mockAccountId]: {
      balance: '0x1',
      stakedBalance: '0x2',
    },
  },
  [POLYGON_CHAIN_ID]: {
    [mockAccountId]: {
      balance: '0x3',
    },
  },
};

const mockInternalAccounts = {
  selectedAccount: mockAccountId,
  accounts: {
    [mockAccountId]: {
      address: mockAccountId,
    },
  },
};

// Mock Engine for render tests
jest.mock('../../core/Engine', () => ({
  context: {},
  state: {
    NetworkController: {
      networkConfigurationsByChainId: mockNetworkConfigurationsByChainId,
    },
    AccountTrackerController: {
      accountsByChainId: mockAccountsByChainId,
    } as Partial<AccountTrackerController['state']>,
    TokensController: {
      allTokens: mockAllTokens,
    } as Partial<TokensController['state']>,
    AccountsController: {
      internalAccounts: mockInternalAccounts,
    } as unknown as Partial<AccountsControllerState>,
  } as EngineState,
}));

describe('re-renders', () => {
  const mockState: RootState = {
    engine: {
      backgroundState: {
        NetworkController: {
          networkConfigurationsByChainId: mockNetworkConfigurationsByChainId,
        },
        AccountTrackerController: {
          accountsByChainId: mockAccountsByChainId,
        },
        TokensController: {
          allTokens: mockAllTokens,
        },
        AccountsController: {
          internalAccounts: mockInternalAccounts,
        },
      },
    },
  } as unknown as RootState;
  const mockRenderCall = jest.fn();
  let getByText: GetByQuery<TextMatch, CommonQueryOptions & TextMatchOptions>;
  let store: Store;

  beforeEach(() => {
    mockRenderCall.mockReset();
    // Clear memoized selectors for each test
    selectAccountTokensAcrossChains.memoizedResultFunc.clearCache();
    const MockComponent = () => {
      const selectedAccountTokensChains = useSelector(
        selectAccountTokensAcrossChains,
      );
      mockRenderCall();
      return (
        <>
          {selectedAccountTokensChains[ETH_CHAIN_ID]?.map((token) => (
            <Text key={token.address}>{token.name}</Text>
          ))}
        </>
      );
    };
    const { store: testStore, getByText: testGetByText } = renderWithProvider(
      <MockComponent />,
      {
        state: mockState,
      },
    );
    getByText = testGetByText;
    store = testStore;
  });

  it('re-renders token list once when new token is added', async () => {
    expect(mockRenderCall).toHaveBeenCalledTimes(1);
    mockRenderCall.mockReset();

    const newToken = {
      address: '0xNewTokenAddress',
      symbol: 'NEW',
      decimals: 18,
      name: 'New Token',
    };

    Engine.state.TokensController.allTokens = {
      ...mockAllTokens,
      [ETH_CHAIN_ID]: {
        ...mockAllTokens[ETH_CHAIN_ID],
        [mockAccountId]: [
          ...mockAllTokens[ETH_CHAIN_ID][mockAccountId],
          newToken,
        ],
      },
    };

    act(() => {
      store.dispatch({
        type: 'UPDATE_BG_STATE',
        payload: {
          key: 'TokensController',
        },
      });
    });

    expect(mockRenderCall).toHaveBeenCalledTimes(1);
    expect(getByText(newToken.name)).toBeDefined();
  });

  it('should return exactly same data if state does not change', async () => {
    expect(mockRenderCall).toHaveBeenCalledTimes(1);
    mockRenderCall.mockReset();
    const result1 = selectAccountTokensAcrossChains(mockState);

    Engine.state.TokensController.allTokens = mockAllTokens;

    act(() => {
      store.dispatch({
        type: 'UPDATE_BG_STATE',
        payload: {
          key: 'TokensController',
        },
      });
    });

    const result2 = selectAccountTokensAcrossChains(mockState);

    expect(result1 === result2).toBe(true);
    // same data should not trigger re-render
    expect(mockRenderCall).toHaveBeenCalledTimes(0);
  });
});
