import { Hex } from '@metamask/utils';
import { zeroAddress } from 'ethereumjs-util';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  renderFromTokenMinimalUnit,
  balanceToFiatNumber,
  weiToFiatNumber,
  toHexadecimal,
  hexToBN,
  renderFromWei,
} from '../../../util/number';
import { isTestNet } from '../../../util/networks';
import { getGlobalNetworkClientId } from '../../../util/networks/global-network';
import { toFormattedAddress } from '../../../util/address';
import { isZero } from '../../../util/lodash';
import Logger from '../../../util/Logger';
import type { EngineContext } from '../types';
import type { RootState } from '../../../reducers';

type FiatBalanceContext = Pick<
  EngineContext,
  | 'CurrencyRateController'
  | 'AccountsController'
  | 'AccountTrackerController'
  | 'TokenBalancesController'
  | 'TokenRatesController'
  | 'TokensController'
  | 'NetworkController'
>;

export type FiatBalanceResult = {
  ethFiat: number;
  tokenFiat: number;
  tokenFiat1dAgo: number;
  ethFiat1dAgo: number;
  totalNativeTokenBalance: string;
  ticker: string;
};

/**
 * Calculates the total EVM fiat account balance for the given account (or the currently selected account).
 *
 * @param context - The relevant controller context.
 * @param storeGetState - A function that returns the current Redux root state.
 * @param account - Optional internal account to calculate for. Defaults to the selected account.
 * @returns The fiat balance breakdown.
 */
export function getTotalEvmFiatAccountBalance(
  context: FiatBalanceContext,
  storeGetState: () => RootState,
  account?: InternalAccount,
): FiatBalanceResult {
  const {
    CurrencyRateController,
    AccountsController,
    AccountTrackerController,
    TokenBalancesController,
    TokenRatesController,
    TokensController,
    NetworkController,
  } = context;

  const selectedInternalAccount =
    account ??
    AccountsController.getAccount(
      AccountsController.state.internalAccounts.selectedAccount,
    );

  if (selectedInternalAccount) {
    const selectedInternalAccountFormattedAddress = toFormattedAddress(
      selectedInternalAccount.address,
    );
    const { currentCurrency } = CurrencyRateController.state;
    const { chainId, ticker } = NetworkController.getNetworkClientById(
      getGlobalNetworkClientId(NetworkController),
    ).configuration;
    const { settings: { showFiatOnTestnets } = {} } = storeGetState();

    if (isTestNet(chainId) && !showFiatOnTestnets) {
      return {
        ethFiat: 0,
        tokenFiat: 0,
        ethFiat1dAgo: 0,
        tokenFiat1dAgo: 0,
        totalNativeTokenBalance: '0',
        ticker: '',
      };
    }

    const conversionRate =
      CurrencyRateController.state?.currencyRates?.[ticker]?.conversionRate ??
      0;

    const { accountsByChainId } = AccountTrackerController.state;
    const chainIdHex = toHexadecimal(chainId);
    const tokens =
      TokensController.state.allTokens?.[chainIdHex]?.[
      selectedInternalAccount.address
      ] || [];
    const { marketData } = TokenRatesController.state;
    const tokenExchangeRates = marketData?.[toHexadecimal(chainId)];

    let ethFiat = 0;
    let ethFiat1dAgo = 0;
    let tokenFiat = 0;
    let tokenFiat1dAgo = 0;
    let totalNativeTokenBalance = '0';
    const decimalsToShow = (currentCurrency === 'usd' && 2) || undefined;
    if (
      accountsByChainId?.[toHexadecimal(chainId)]?.[
      selectedInternalAccountFormattedAddress
      ]
    ) {
      const balanceHex =
        accountsByChainId[toHexadecimal(chainId)][
          selectedInternalAccountFormattedAddress
        ].balance;

      const balanceBN = hexToBN(balanceHex);
      totalNativeTokenBalance = renderFromWei(balanceHex);

      // TODO - Non EVM accounts like BTC do not use hex formatted balances. We will need to modify this to use CAIP-2 identifiers in the future.
      const stakedBalanceBN = hexToBN(
        accountsByChainId[toHexadecimal(chainId)][
          selectedInternalAccountFormattedAddress
        ].stakedBalance || '0x00',
      );
      const totalAccountBalance = balanceBN
        .add(stakedBalanceBN)
        .toString('hex');
      ethFiat = weiToFiatNumber(
        totalAccountBalance,
        conversionRate,
        decimalsToShow,
      );
    }

    const ethPricePercentChange1d =
      tokenExchangeRates?.[zeroAddress() as Hex]?.pricePercentChange1d;

    ethFiat1dAgo =
      ethPricePercentChange1d !== undefined
        ? ethFiat / (1 + ethPricePercentChange1d / 100)
        : ethFiat;

    if (tokens.length > 0) {
      const { tokenBalances: allTokenBalances } =
        TokenBalancesController.state;

      const tokenBalances =
        allTokenBalances?.[selectedInternalAccount.address as Hex]?.[
        chainId
        ] ?? {};
      tokens.forEach(
        (item: { address: string; balance?: string; decimals: number }) => {
          const exchangeRate =
            tokenExchangeRates?.[item.address as Hex]?.price;

          const tokenBalance =
            item.balance ||
            (item.address in tokenBalances
              ? renderFromTokenMinimalUnit(
                tokenBalances[item.address as Hex],
                item.decimals,
              )
              : undefined);
          const tokenBalanceFiat = balanceToFiatNumber(
            // TODO: Fix this by handling or eliminating the undefined case
            // @ts-expect-error This variable can be `undefined`, which would break here.
            tokenBalance,
            conversionRate,
            exchangeRate,
            decimalsToShow,
          );

          const tokenPricePercentChange1d =
            tokenExchangeRates?.[item.address as Hex]?.pricePercentChange1d;

          const tokenBalance1dAgo =
            tokenPricePercentChange1d !== undefined
              ? tokenBalanceFiat / (1 + tokenPricePercentChange1d / 100)
              : tokenBalanceFiat;

          tokenFiat += tokenBalanceFiat;
          tokenFiat1dAgo += tokenBalance1dAgo;
        },
      );
    }

    return {
      ethFiat: ethFiat ?? 0,
      ethFiat1dAgo: ethFiat1dAgo ?? 0,
      tokenFiat: tokenFiat ?? 0,
      tokenFiat1dAgo: tokenFiat1dAgo ?? 0,
      totalNativeTokenBalance: totalNativeTokenBalance ?? '0',
      ticker,
    };
  }
  // if selectedInternalAccount is undefined, return default 0 value.
  return {
    ethFiat: 0,
    tokenFiat: 0,
    ethFiat1dAgo: 0,
    tokenFiat1dAgo: 0,
    totalNativeTokenBalance: '0',
    ticker: '',
  };
}

/**
 * Returns true or false whether the user has funds or not.
 *
 * @param context - The relevant controller context.
 * @param storeGetState - A function that returns the current Redux root state.
 * @returns Whether the user has funds.
 */
export function hasFunds(
  context: FiatBalanceContext,
  storeGetState: () => RootState,
): boolean | undefined {
  try {
    const {
      engine: { backgroundState },
    } = storeGetState();
    // TODO: Check `allNfts[currentChainId]` property instead
    // @ts-expect-error This property does not exist
    const nfts = backgroundState.NftController.nfts;

    const { tokenBalances } = backgroundState.TokenBalancesController;

    let tokenFound = false;
    tokenLoop: for (const chains of Object.values(tokenBalances)) {
      for (const tokens of Object.values(chains)) {
        for (const balance of Object.values(tokens)) {
          if (!isZero(balance)) {
            tokenFound = true;
            break tokenLoop;
          }
        }
      }
    }

    const fiatBalance = getTotalEvmFiatAccountBalance(context, storeGetState) || 0;
    const totalFiatBalance = fiatBalance.ethFiat + fiatBalance.tokenFiat;

    return totalFiatBalance > 0 || tokenFound || nfts.length > 0;
  } catch (e) {
    Logger.log('Error while getting user funds', e);
  }
}
