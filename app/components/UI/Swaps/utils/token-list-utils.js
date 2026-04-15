
import { isSwapsNativeAsset } from '.';
import { safeToChecksumAddress } from '../../../../util/address';
import { balanceToFiatNumber, hexToBN, renderFromTokenMinimalUnit, renderFromWei, weiToFiatNumber } from '../../../../util/number';















































// token address -> atomic hex balance

export const getFiatValue = ({
  token,
  account,
  tokenExchangeRates,
  balances,
  conversionRate,
  currencyCode







}) => {
  const tokenAddress = safeToChecksumAddress(token.address);

  if (isSwapsNativeAsset(token)) {
    const balance = account ? renderFromWei(
      account.balance
    ) : undefined;
    const balanceFiat = account ? weiToFiatNumber(
      hexToBN(account.balance),
      conversionRate,
      currencyCode === 'usd' && 2 || undefined
    ).toString() : undefined;
    return { balance, balanceFiat };
  }

  const exchangeRate =
  tokenExchangeRates && tokenAddress && tokenAddress in tokenExchangeRates ?
  tokenExchangeRates[tokenAddress]?.price :
  undefined;
  const balance =
  tokenAddress && tokenAddress in balances ?
  renderFromTokenMinimalUnit(balances[tokenAddress], token.decimals) :
  '0';
  const balanceFiat = exchangeRate ?
  balanceToFiatNumber(
    balance,
    conversionRate,
    exchangeRate
  ).toString() :
  undefined;
  return { balance, balanceFiat };
};

export const getTokenWithFiatValue = ({
  token,
  account,
  tokenExchangeRates,
  balances,
  conversionRate,
  currencyCode







}) => {
  const { balance, balanceFiat } = getFiatValue({
    token,
    account,
    tokenExchangeRates,
    balances,
    conversionRate,
    currencyCode
  });
  return { ...token, balance, balanceFiat };
};

export const getSortedTokensByFiatValue = ({
  tokens,
  account,
  tokenExchangeRates,
  balances,
  conversionRate,
  currencyCode







}) => tokens.map((token) => getTokenWithFiatValue({
  token,
  account,
  tokenExchangeRates,
  balances,
  conversionRate,
  currencyCode
})).sort((a, b) => {
  const bFiat = Number(b.balanceFiat ?? 0);
  const aFiat = Number(a.balanceFiat ?? 0);
  return bFiat - aFiat;
});