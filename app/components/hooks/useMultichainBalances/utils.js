/* eslint-disable arrow-body-style */

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import {
  getMultichainNetworkAggregatedBalance } from

'../../../selectors/multichain';
import { isEvmAccountType } from '@metamask/keyring-api';





///: END:ONLY_INCLUDE_IF
import { formatWithThreshold } from '../../../util/assets';
import I18n from '../../../../locales/i18n';
import Engine from '../../../core/Engine';


import { isPortfolioViewEnabled, isTestNet } from '../../../util/networks';

// Production balance calculation (EVM)
const getEvmBalance = (
account,
isOriginalNativeEvmTokenSymbol,
totalFiatBalancesCrossEvmChain,
currentCurrency) =>
{
  const balance = Engine.getTotalEvmFiatAccountBalance(account);
  let total;

  const isPortfolioEnabled = isPortfolioViewEnabled();

  if (isOriginalNativeEvmTokenSymbol) {
    if (isPortfolioEnabled) {
      total =
      totalFiatBalancesCrossEvmChain[account?.address]?.
      totalFiatBalance ?? 0;
    } else {
      const tokenFiatTotal = balance?.tokenFiat ?? 0;
      const ethFiatTotal = balance?.ethFiat ?? 0;
      total = tokenFiatTotal + ethFiatTotal;
    }
  } else if (isPortfolioEnabled) {
    total =
    totalFiatBalancesCrossEvmChain[account?.address]?.
    totalTokenFiat ?? 0;
  } else {
    total = balance?.tokenFiat ?? 0;
  }

  const displayBalance = formatWithThreshold(total, 0, I18n.locale, {
    style: 'currency',
    currency: currentCurrency.toUpperCase()
  });

  return {
    displayBalance,
    totalFiatBalance: total,
    totalNativeTokenBalance: balance?.totalNativeTokenBalance,
    nativeTokenUnit: balance?.ticker
  };
};

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
const getMultiChainFiatBalance = (
balance,
currency) =>
{
  if (balance === undefined) return '0';
  return formatWithThreshold(balance, 0, I18n.locale, {
    style: 'currency',
    currency: currency.toUpperCase()
  });
};

const getNonEvmDisplayBalance = (
nonEvmAccountBalance,
shouldShowFiat,
currentCurrency) =>
{
  if (!shouldShowFiat || !nonEvmAccountBalance.totalBalanceFiat) {
    if (!nonEvmAccountBalance.totalNativeTokenBalance) {
      return '0';
    }
    return `${nonEvmAccountBalance.totalNativeTokenBalance.amount} ${nonEvmAccountBalance.totalNativeTokenBalance.unit}`;
  }

  return getMultiChainFiatBalance(
    nonEvmAccountBalance.totalBalanceFiat,
    currentCurrency
  );
};
///: END:ONLY_INCLUDE_IF

export const getShouldShowAggregatedPercentage = (chainId) => {
  return !isTestNet(chainId);
};

export const getAggregatedBalance = (account) => {
  const balance = Engine.getTotalEvmFiatAccountBalance(account);
  return {
    ethFiat: balance?.ethFiat ?? 0,
    tokenFiat: balance?.tokenFiat ?? 0,
    tokenFiat1dAgo: balance?.tokenFiat1dAgo ?? 0,
    ethFiat1dAgo: balance?.ethFiat1dAgo ?? 0
  };
};

export const getAccountBalanceData = (
account,
currentCurrency,
totalFiatBalancesCrossEvmChain,
isOriginalNativeEvmTokenSymbol,

multichainBalances,
multichainAssets,
multichainAssetsRates,
nonEvmChainId,
shouldShowFiat
///: END:ONLY_INCLUDE_IF
) =>




{
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  if (!isEvmAccountType(account.type)) {
    const nonEvmAccountBalance = getMultichainNetworkAggregatedBalance(
      account,
      multichainBalances,
      multichainAssets,
      multichainAssetsRates,
      nonEvmChainId
    );
    return {
      displayBalance: getNonEvmDisplayBalance(
        nonEvmAccountBalance,
        shouldShowFiat,
        currentCurrency
      ),
      totalFiatBalance: nonEvmAccountBalance.totalBalanceFiat,
      totalNativeTokenBalance:
      nonEvmAccountBalance.totalNativeTokenBalance?.amount,
      nativeTokenUnit: nonEvmAccountBalance.totalNativeTokenBalance?.unit || ''
    };
  }
  ///: END:ONLY_INCLUDE_IF
  const evmAccountBalance = getEvmBalance(
    account,
    isOriginalNativeEvmTokenSymbol,
    totalFiatBalancesCrossEvmChain,
    currentCurrency
  );
  return {
    displayBalance: evmAccountBalance.displayBalance,
    totalFiatBalance: evmAccountBalance.totalFiatBalance,
    totalNativeTokenBalance:
    evmAccountBalance.totalNativeTokenBalance?.toString() || '0',
    nativeTokenUnit: evmAccountBalance.nativeTokenUnit || ''
  };
};