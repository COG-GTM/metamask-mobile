import { renderFromWei, hexToBN } from '../../../../../../util/number';
import {
  getTicker,
  decodeTransferData } from
'../../../../../../util/transactions';
import { strings } from '../../../../../../../locales/i18n';








export const generateInsufficientBalanceMessage = (
weiBalance,
transactionValue,
ticker) =>
{
  const amount = renderFromWei(transactionValue.sub(weiBalance));
  const tokenSymbol = getTicker(ticker);
  return strings('transaction.insufficient_amount', {
    amount,
    tokenSymbol
  });
};

export const validateBalance = (weiBalance, transactionValue) =>
!weiBalance.gte(transactionValue) || weiBalance.isZero();

export const validateSufficientTokenBalance = (
transaction,


contractBalances,
selectedAsset) =>
{
  const [,, amount] = decodeTransferData('transfer', transaction.data);
  const tokenBalance = hexToBN(contractBalances[selectedAsset.address]);
  const weiInput = hexToBN(amount);

  if (!tokenBalance.gte(weiInput)) {
    return strings('transaction.insufficient_tokens', {
      token: selectedAsset.symbol
    });
  }

  return undefined;
};

export const validateSufficientBalance = (
weiBalance,
totalTransactionValue,
ticker) =>
{
  const weiBalanceBN = hexToBN(weiBalance);
  const totalTransactionValueBN = hexToBN(totalTransactionValue);

  if (validateBalance(weiBalanceBN, totalTransactionValueBN)) {
    return generateInsufficientBalanceMessage(
      weiBalanceBN,
      totalTransactionValueBN,
      ticker
    );
  }
  return undefined;
};