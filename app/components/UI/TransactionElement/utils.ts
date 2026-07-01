import {
  hexToBN,
  weiToFiat as weiToFiatBase,
  renderFromWei as renderFromWeiBase,
  balanceToFiat as balanceToFiatBase,
  renderToGwei as renderToGweiBase,
  isBN,
  renderFromTokenMinimalUnit as renderFromTokenMinimalUnitBase,
  fromTokenMinimalUnit as fromTokenMinimalUnitBase,
  balanceToFiatNumber as balanceToFiatNumberBase,
  weiToFiatNumber as weiToFiatNumberBase,
  addCurrencySymbol as addCurrencySymbolBase,
  BNToHex,
  limitToMaximumDecimalPlaces as limitToMaximumDecimalPlacesBase,
} from '../../../util/number';
import { strings } from '../../../../locales/i18n';
import {
  renderFullAddress,
  safeToChecksumAddress,
} from '../../../util/address';
import { sumHexWEIs } from '../../../util/conversions';
import {
  decodeTransferData,
  isCollectibleAddress,
  getActionKey,
  TRANSACTION_TYPES,
  calculateEIP1559GasFeeHexes,
} from '../../../util/transactions';
import { toChecksumAddress } from 'ethereumjs-util';
import type BN from 'bnjs4';
import { swapsUtils } from '@metamask/swaps-controller';
import { isSwapsNativeAsset } from '../Swaps/utils';
import { toLowerCaseEquals } from '../../../util/general';
import Engine from '../../../core/Engine';
import {
  isEIP1559Transaction,
  TransactionType,
  type TransactionParams,
} from '@metamask/transaction-controller';

const { getSwapsContractAddress } = swapsUtils;

// Thin adapters around the loosely-typed `util/number` JS helpers. Decoded
// transaction values arrive as broad unions (string wei, BN, optional fields);
// the underlying helpers already guard these at runtime, so these adapters only
// bridge the static types without changing behavior.
const weiToFiat = (
  wei: unknown,
  conversionRate?: number,
  currencyCode?: string,
  decimalsToShow?: number,
): string | undefined =>
  weiToFiatBase(
    wei as BN,
    conversionRate ?? null,
    currencyCode as string,
    decimalsToShow,
  );

const renderFromWei = (value: unknown, decimalsToShow?: number): string =>
  renderFromWeiBase(value as BN, decimalsToShow);

const renderToGwei = (value: unknown, unit?: string): string =>
  renderToGweiBase(value as BN, unit);

const weiToFiatNumber = (
  wei: unknown,
  conversionRate?: number,
  decimalsToShow?: number,
): number => weiToFiatNumberBase(wei as BN, conversionRate as number, decimalsToShow);

const balanceToFiat = (
  balance: unknown,
  conversionRate?: number,
  exchangeRate?: number,
  currencyCode?: string,
): string | undefined =>
  balanceToFiatBase(
    balance as number,
    conversionRate ?? null,
    exchangeRate,
    currencyCode as string,
  );

const balanceToFiatNumber = (
  balance: unknown,
  conversionRate?: number,
  exchangeRate?: number,
  decimalsToShow?: number,
): number =>
  balanceToFiatNumberBase(
    balance as number,
    conversionRate as number,
    exchangeRate as number,
    decimalsToShow,
  );

const renderFromTokenMinimalUnit = (
  tokenValue: unknown,
  decimals?: number,
  decimalsToShow?: number,
): string =>
  renderFromTokenMinimalUnitBase(tokenValue as BN, decimals as number, decimalsToShow);

const fromTokenMinimalUnit = (
  minimalInput: unknown,
  decimals?: number,
  isRounding?: boolean,
): string =>
  fromTokenMinimalUnitBase(minimalInput as string, decimals as number, isRounding);

const addCurrencySymbol = (
  amount: unknown,
  currencyCode?: string,
  extendDecimals?: boolean,
): string =>
  addCurrencySymbolBase(amount as number, currencyCode as string, extendDecimals);

const limitToMaximumDecimalPlaces = (
  value: unknown,
  decimals?: number,
): string => limitToMaximumDecimalPlacesBase(value as number, decimals);

interface TxParams {
  from: string;
  to: string;
  data: string;
  nonce?: string;
  value: string;
  gas: string;
  gasPrice?: string;
  gasUsed?: string;
  estimatedBaseFee?: string;
  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
  multiLayerL1FeeTotal?: string;
  [key: string]: unknown;
}

interface TransferInformation {
  symbol?: string;
  decimals?: number;
  contractAddress?: string;
}

interface DecodeTx {
  id?: string;
  hash?: string;
  status?: string;
  chainId?: string;
  isTransfer?: boolean;
  txParams: TxParams;
  transferInformation?: TransferInformation;
  [key: string]: unknown;
}

interface DecodeToken {
  symbol?: string;
  decimals?: number;
  address: string;
  swaps?: DecodeToken;
  [key: string]: unknown;
}

interface DecodeCollectible {
  address?: string;
  name?: string;
  symbol?: string;
  [key: string]: unknown;
}

interface SwapTransaction {
  gasUsed?: string;
  action?: string;
  upTo?: string;
  sourceAmount?: string;
  destinationAmount?: string;
  receivedDestinationAmount?: number;
  sourceToken?: DecodeToken;
  destinationToken?: DecodeToken;
  [key: string]: unknown;
}

interface DecodeTransactionArgs {
  tx: DecodeTx;
  txChainId?: string;
  chainId?: string;
  networkConfigurationsByChainId?: Record<
    string,
    { nativeCurrency?: string }
  >;
  conversionRate?: number;
  currentCurrency: string;
  tokens?: Record<string, DecodeToken>;
  contractExchangeRates?: Record<string, { price?: number }>;
  collectibleContracts?: DecodeCollectible[];
  totalGas: string | number | BN;
  actionKey?: string;
  primaryCurrency?: string;
  selectedAddress?: string;
  swapsTransactions?: Record<string, SwapTransaction>;
  swapsTokens?: DecodeToken[];
  assetSymbol?: string;
  [key: string]: unknown;
}

export type IncomingTransferArgs = DecodeTransactionArgs & {
  tx: DecodeTx & { transferInformation: TransferInformation };
};

export interface TransactionElement {
  actionKey?: string;
  value?: string;
  fiatValue?: string | boolean;
  transactionType?: string;
  nonce?: string;
  renderTo?: string;
  renderFrom?: string;
  isIncomingTransfer?: boolean;
  contractDeployment?: boolean;
  notificationKey?: string;
  [key: string]: unknown;
}

export interface TransactionDetails {
  renderTotalGas?: string;
  renderValue?: string;
  summaryAmount?: string;
  summaryFee?: string;
  summaryTotalAmount?: string;
  summarySecondaryTotalAmount?: string;
  txChainId?: string;
  renderFrom?: string;
  renderTo?: string;
  hash?: string;
  renderGas?: string | number;
  renderGasPrice?: string;
  transactionType?: string;
  [key: string]: unknown;
}

function calculateTotalGas(transaction: TxParams) {
  const {
    gas,
    gasPrice,
    gasUsed,
    estimatedBaseFee,
    maxPriorityFeePerGas,
    maxFeePerGas,
    multiLayerL1FeeTotal,
  } = transaction;
  if (isEIP1559Transaction(transaction as unknown as TransactionParams)) {
    const eip1559GasHex = calculateEIP1559GasFeeHexes({
      gasLimitHex: gasUsed || gas,
      estimatedGasLimitHex: undefined,
      estimatedBaseFeeHex: estimatedBaseFee || '0x0',
      suggestedMaxPriorityFeePerGasHex: maxPriorityFeePerGas,
      suggestedMaxFeePerGasHex: maxFeePerGas,
    });
    return hexToBN(eip1559GasHex.gasFeeMinHex);
  }
  const gasBN = hexToBN(gas);
  const gasPriceBN = hexToBN(gasPrice);
  const gasUsedBN = gasUsed ? hexToBN(gasUsed) : null;
  let totalGas = hexToBN('0x0');
  if (gasUsedBN && isBN(gasUsedBN) && isBN(gasPriceBN)) {
    totalGas = gasUsedBN.mul(gasPriceBN);
  }
  if (isBN(gasBN) && isBN(gasPriceBN)) {
    totalGas = gasBN.mul(gasPriceBN);
  }
  if (multiLayerL1FeeTotal) {
    totalGas = hexToBN(sumHexWEIs([BNToHex(totalGas), multiLayerL1FeeTotal]));
  }
  return totalGas;
}

function renderGwei(transaction: TxParams) {
  const {
    gasPrice,
    estimatedBaseFee,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gas,
  } = transaction;

  if (isEIP1559Transaction(transaction as unknown as TransactionParams)) {
    const eip1559GasHex = calculateEIP1559GasFeeHexes({
      gasLimitHex: gas,
      estimatedGasLimitHex: undefined,
      estimatedBaseFeeHex: estimatedBaseFee || '0x0',
      suggestedMaxPriorityFeePerGasHex: maxPriorityFeePerGas,
      suggestedMaxFeePerGasHex: maxFeePerGas,
    });

    return renderToGwei(
      eip1559GasHex.estimatedBaseFee_PLUS_suggestedMaxPriorityFeePerGasHex,
    );
  }
  return renderToGwei(gasPrice);
}

function getTokenTransfer(
  args: DecodeTransactionArgs,
): [TransactionElement, TransactionDetails] {
  const {
    tx: {
      txParams: { from, to, data, nonce },
    },
    txChainId,
    networkConfigurationsByChainId,
    conversionRate,
    currentCurrency,
    tokens,
    contractExchangeRates,
    totalGas,
    actionKey,
    primaryCurrency,
    selectedAddress,
  } = args;

  const [, , encodedAmount] = decodeTransferData('transfer', data);
  const amount = hexToBN(encodedAmount);
  const safeTokens = tokens || {};
  const checksumTo = safeToChecksumAddress(to) as string;
  const userHasToken = checksumTo in safeTokens;
  const token = userHasToken ? safeTokens[checksumTo] : null;
  const renderActionKey = token
    ? `${strings('transactions.sent')} ${token.symbol}`
    : actionKey;
  const renderTokenAmount = token
    ? `${renderFromTokenMinimalUnit(amount, token.decimals)} ${token.symbol}`
    : undefined;
  const exchangeRate =
    token && contractExchangeRates
      ? contractExchangeRates[token.address]?.price
      : undefined;
  let renderTokenFiatAmount, renderTokenFiatNumber;
  if (exchangeRate) {
    renderTokenFiatAmount = balanceToFiat(
      fromTokenMinimalUnit(amount, token?.decimals) || 0,
      conversionRate,
      exchangeRate,
      currentCurrency,
    );
    renderTokenFiatNumber = balanceToFiatNumber(
      fromTokenMinimalUnit(amount, token?.decimals) || 0,
      conversionRate,
      exchangeRate,
    );
  }

  const renderToken = token
    ? `${renderFromTokenMinimalUnit(amount, token.decimals)} ${token.symbol}`
    : strings('transaction.value_not_available');
  const totalFiatNumber = renderTokenFiatNumber
    ? weiToFiatNumber(totalGas, conversionRate) + renderTokenFiatNumber
    : weiToFiatNumber(totalGas, conversionRate);

  const ticker =
    networkConfigurationsByChainId?.[txChainId ?? '']?.nativeCurrency;

  let transactionDetails: TransactionDetails = {
    renderTotalGas: `${renderFromWei(totalGas)} ${ticker}`,
    renderValue: renderToken,
  };
  if (primaryCurrency === 'ETH') {
    transactionDetails = {
      ...transactionDetails,
      summaryAmount: renderToken,
      summaryFee: `${renderFromWei(totalGas)} ${ticker}`,
      summaryTotalAmount: `${renderToken} ${strings(
        'unit.divisor',
      )} ${renderFromWei(totalGas)} ${ticker}`,
      summarySecondaryTotalAmount: totalFiatNumber
        ? `${addCurrencySymbol(totalFiatNumber, currentCurrency)}`
        : undefined,
    };
  } else {
    transactionDetails = {
      ...transactionDetails,
      summaryAmount: renderTokenFiatAmount
        ? `${renderTokenFiatAmount}`
        : `${addCurrencySymbol(0, currentCurrency)}`,
      summaryFee: weiToFiat(totalGas, conversionRate, currentCurrency),
      summaryTotalAmount: totalFiatNumber
        ? `${addCurrencySymbol(totalFiatNumber, currentCurrency)}`
        : undefined,
      summarySecondaryTotalAmount: `${renderToken} ${strings(
        'unit.divisor',
      )} ${renderFromWei(totalGas)} ${ticker}`,
      txChainId,
    };
  }

  const { SENT_TOKEN, RECEIVED_TOKEN } = TRANSACTION_TYPES;
  const transactionType =
    renderFullAddress(from) === selectedAddress ? SENT_TOKEN : RECEIVED_TOKEN;
  const transactionElement = {
    actionKey: renderActionKey,
    value: !renderTokenAmount
      ? strings('transaction.value_not_available')
      : renderTokenAmount,
    fiatValue: !!renderTokenFiatAmount && `- ${renderTokenFiatAmount}`,
    transactionType,
    nonce,
  };

  return [transactionElement, transactionDetails];
}

function getCollectibleTransfer(
  args: DecodeTransactionArgs,
): [TransactionElement, TransactionDetails] {
  const {
    tx: {
      txParams: { from, to, data },
    },
    txChainId,
    networkConfigurationsByChainId,
    collectibleContracts,
    totalGas,
    conversionRate,
    currentCurrency,
    primaryCurrency,
    selectedAddress,
  } = args;
  let actionKey;
  const [, tokenId] = decodeTransferData('transfer', data);
  const ticker =
    networkConfigurationsByChainId?.[txChainId ?? '']?.nativeCurrency;
  const collectible = (collectibleContracts || []).find((collectibleItem) =>
    toLowerCaseEquals(collectibleItem.address, to),
  );
  if (collectible) {
    actionKey = `${strings('transactions.sent')} ${collectible.name}`;
  } else {
    actionKey = strings('transactions.sent_collectible');
  }

  const renderCollectible = collectible
    ? `${strings('unit.token_id')} ${tokenId} ${collectible.symbol}`
    : `${strings('unit.token_id')} ${tokenId}`;

  let transactionDetails: TransactionDetails = {
    renderValue: renderCollectible,
  };

  if (primaryCurrency === 'ETH') {
    transactionDetails = {
      ...transactionDetails,
      summaryAmount: renderCollectible,
      summaryFee: `${renderFromWei(totalGas)} ${ticker}`,
      summaryTotalAmount: `${renderCollectible} ${strings(
        'unit.divisor',
      )} ${renderFromWei(totalGas)} ${strings('unit.eth')}`,
      summarySecondaryTotalAmount: weiToFiat(
        totalGas,
        conversionRate,
        currentCurrency,
      ),
      txChainId,
    };
  } else {
    transactionDetails = {
      ...transactionDetails,
      summaryAmount: renderCollectible,
      summaryFee: weiToFiat(totalGas, conversionRate, currentCurrency),
      summaryTotalAmount: weiToFiat(totalGas, conversionRate, currentCurrency),
      summarySecondaryTotalAmount: `${renderCollectible} ${strings(
        'unit.divisor',
      )} ${renderFromWei(totalGas)} ${strings('unit.eth')}`,
      txChainId,
    };
  }

  let transactionType;
  if (renderFullAddress(from) === selectedAddress)
    transactionType = TRANSACTION_TYPES.SENT_COLLECTIBLE;
  else transactionType = TRANSACTION_TYPES.RECEIVED_COLLECTIBLE;

  const transactionElement = {
    actionKey,
    value: `${strings('unit.token_id')}${tokenId}`,
    fiatValue: collectible ? collectible.symbol : undefined,
    transactionType,
  };

  return [transactionElement, transactionDetails];
}

export function decodeIncomingTransfer(
  args: IncomingTransferArgs,
): [TransactionElement, TransactionDetails] {
  const {
    tx: {
      txParams: { to, from, value },
      transferInformation: { symbol, decimals, contractAddress },
      hash,
    },
    txChainId,
    networkConfigurationsByChainId,
    conversionRate,
    currentCurrency,
    contractExchangeRates,
    totalGas,
    actionKey,
    primaryCurrency,
    selectedAddress,
  } = args;

  const amount = hexToBN(value);
  const token = { symbol, decimals, address: contractAddress };

  const renderTokenAmount = token
    ? `${renderFromTokenMinimalUnit(amount, token.decimals)} ${token.symbol}`
    : undefined;
  const exchangeRate =
    token && contractExchangeRates
      ? contractExchangeRates[toChecksumAddress(token.address as string)]?.price
      : undefined;

  let renderTokenFiatAmount, renderTokenFiatNumber;
  if (exchangeRate) {
    renderTokenFiatAmount = balanceToFiat(
      fromTokenMinimalUnit(amount, token.decimals) || 0,
      conversionRate,
      exchangeRate,
      currentCurrency,
    );

    renderTokenFiatNumber = balanceToFiatNumber(
      fromTokenMinimalUnit(amount, token.decimals) || 0,
      conversionRate,
      exchangeRate,
    );
  }

  const renderToken = token
    ? `${renderFromTokenMinimalUnit(amount, token.decimals)} ${token.symbol}`
    : strings('transaction.value_not_available');
  const totalFiatNumber = renderTokenFiatNumber
    ? weiToFiatNumber(totalGas, conversionRate) + renderTokenFiatNumber
    : weiToFiatNumber(totalGas, conversionRate);

  const ticker =
    networkConfigurationsByChainId?.[txChainId ?? '']?.nativeCurrency;

  const { SENT_TOKEN, RECEIVED_TOKEN } = TRANSACTION_TYPES;
  const transactionType =
    renderFullAddress(from) === selectedAddress ? SENT_TOKEN : RECEIVED_TOKEN;

  let transactionDetails: TransactionDetails = {
    renderTotalGas: `${renderFromWei(totalGas)} ${ticker}`,
    renderValue: renderToken,
    renderFrom: renderFullAddress(from),
    renderTo: renderFullAddress(to),
    hash,
    transactionType,
    txChainId,
  };
  if (primaryCurrency === 'ETH') {
    transactionDetails = {
      ...transactionDetails,
      summaryAmount: renderToken,
      summaryFee: `${renderFromWei(totalGas)} ${ticker}`,
      summaryTotalAmount: `${renderToken} ${strings(
        'unit.divisor',
      )} ${renderFromWei(totalGas)} ${ticker}`,
      summarySecondaryTotalAmount: totalFiatNumber
        ? `${addCurrencySymbol(totalFiatNumber, currentCurrency)}`
        : undefined,
    };
  } else {
    transactionDetails = {
      ...transactionDetails,
      summaryAmount: renderTokenFiatAmount
        ? `${renderTokenFiatAmount}`
        : `${addCurrencySymbol(0, currentCurrency)}`,
      summaryFee: weiToFiat(totalGas, conversionRate, currentCurrency),
      summaryTotalAmount: totalFiatNumber
        ? `${addCurrencySymbol(totalFiatNumber, currentCurrency)}`
        : undefined,
      summarySecondaryTotalAmount: `${renderToken} ${strings(
        'unit.divisor',
      )} ${renderFromWei(totalGas)} ${ticker}`,
    };
  }

  const transactionElement = {
    actionKey,
    renderFrom: renderFullAddress(from),
    renderTo: renderFullAddress(to),
    value: !renderTokenAmount
      ? strings('transaction.value_not_available')
      : renderTokenAmount,
    fiatValue: renderTokenFiatAmount
      ? `${renderTokenFiatAmount}`
      : renderTokenFiatAmount,
    isIncomingTransfer: true,
    transactionType,
  };

  return [transactionElement, transactionDetails];
}

async function decodeTransferTx(
  args: DecodeTransactionArgs,
): Promise<[TransactionElement, TransactionDetails]> {
  const {
    tx: {
      txParams,
      txParams: { from, gas, data, to },
      hash,
    },
    txChainId,
  } = args;

  const decodedData = decodeTransferData('transfer', data);
  const addressTo = decodedData[0];
  let isCollectible = false;
  try {
    isCollectible = await isCollectibleAddress(to, decodedData[1]);
  } catch (e) {
    //
  }

  const totalGas = calculateTotalGas(txParams);
  const renderGas = parseInt(gas, 16).toString();
  const renderGasPrice = renderGwei(txParams);
  let [transactionElement, transactionDetails]: [
    TransactionElement,
    TransactionDetails,
  ] = isCollectible
    ? getCollectibleTransfer({ ...args, totalGas })
    : getTokenTransfer({ ...args, totalGas });
  transactionElement = { ...transactionElement, renderTo: addressTo };
  transactionDetails = {
    ...transactionDetails,
    ...{
      renderFrom: renderFullAddress(from),
      renderTo: renderFullAddress(addressTo),
      hash,
      renderGas,
      renderGasPrice,
      txChainId,
    },
  };
  return [transactionElement, transactionDetails];
}

function decodeTransferFromTx(
  args: DecodeTransactionArgs,
): [TransactionElement, TransactionDetails] {
  const {
    tx: {
      txParams,
      txParams: { gas, data, to },
      hash,
    },
    txChainId,
    networkConfigurationsByChainId,
    collectibleContracts,
    conversionRate,
    currentCurrency,
    primaryCurrency,
    selectedAddress,
  } = args;
  const [addressFrom, addressTo, tokenId] = decodeTransferData(
    'transferFrom',
    data,
  );
  const collectible = (collectibleContracts || []).find((collectibleItem) =>
    toLowerCaseEquals(collectibleItem.address, to),
  );
  let actionKey = args.actionKey;
  if (collectible) {
    actionKey = `${strings('transactions.sent')} ${collectible.name}`;
  }

  const totalGas = calculateTotalGas(txParams);
  const renderCollectible = collectible?.symbol
    ? `${strings('unit.token_id')}${tokenId} ${collectible?.symbol}`
    : `${strings('unit.token_id')}${tokenId}`;

  const renderFrom = renderFullAddress(addressFrom);
  const renderTo = renderFullAddress(addressTo);
  const ticker =
    networkConfigurationsByChainId?.[txChainId ?? '']?.nativeCurrency;

  const { SENT_COLLECTIBLE, RECEIVED_COLLECTIBLE } = TRANSACTION_TYPES;
  const transactionType =
    renderFrom === selectedAddress ? SENT_COLLECTIBLE : RECEIVED_COLLECTIBLE;

  let transactionDetails: TransactionDetails = {
    renderFrom,
    renderTo,
    hash,
    renderValue: renderCollectible,
    renderGas: parseInt(gas, 16).toString(),
    renderGasPrice: renderGwei(txParams),
    renderTotalGas: `${renderFromWei(totalGas)} ${ticker}`,
    txChainId,
  };

  if (primaryCurrency === 'ETH') {
    transactionDetails = {
      ...transactionDetails,
      summaryAmount: renderCollectible,
      summaryFee: `${renderFromWei(totalGas)} ${ticker}`,
      summarySecondaryTotalAmount: weiToFiat(
        totalGas,
        conversionRate,
        currentCurrency,
      ),
      summaryTotalAmount: `${renderCollectible} ${strings(
        'unit.divisor',
      )} ${renderFromWei(totalGas)} ${ticker}`,
      transactionType,
    };
  } else {
    transactionDetails = {
      ...transactionDetails,
      summaryAmount: renderCollectible,
      summaryFee: weiToFiat(totalGas, conversionRate, currentCurrency),
      summarySecondaryTotalAmount: `${renderCollectible} ${strings(
        'unit.divisor',
      )} ${renderFromWei(totalGas)} ${ticker}`,
      summaryTotalAmount: weiToFiat(totalGas, conversionRate, currentCurrency),
      transactionType,
    };
  }

  const transactionElement = {
    renderTo,
    renderFrom,
    actionKey,
    value: `${strings('unit.token_id')}${tokenId}`,
    fiatValue: collectible ? collectible.symbol : undefined,
    transactionType,
  };

  return [transactionElement, transactionDetails];
}

function decodeDeploymentTx(
  args: DecodeTransactionArgs,
): [TransactionElement, TransactionDetails] {
  const {
    tx: {
      txParams,
      txParams: { value, gas, from },
      hash,
    },
    txChainId,
    networkConfigurationsByChainId,
    conversionRate,
    currentCurrency,
    actionKey,
    primaryCurrency,
  } = args;
  const ticker =
    networkConfigurationsByChainId?.[txChainId ?? '']?.nativeCurrency;

  const totalGas = calculateTotalGas(txParams);
  const renderTotalEth = `${renderFromWei(totalGas)} ${ticker}`;
  const renderTotalEthFiat = weiToFiat(
    totalGas,
    conversionRate,
    currentCurrency,
  );
  const totalEth = isBN(value)
    ? (value as unknown as { add: (v: unknown) => unknown }).add(totalGas)
    : totalGas;

  const renderFrom = renderFullAddress(from);
  const renderTo = strings('transactions.to_contract');

  const transactionElement = {
    renderTo,
    renderFrom,
    actionKey,
    value: renderTotalEth,
    fiatValue: renderTotalEthFiat,
    contractDeployment: true,
    transactionType: TRANSACTION_TYPES.SITE_INTERACTION,
  };
  let transactionDetails: TransactionDetails = {
    renderFrom,
    renderTo,
    hash,
    renderValue: `${renderFromWei(value)} ${ticker}`,
    renderGas: parseInt(gas, 16).toString(),
    renderGasPrice: renderGwei(txParams),
    renderTotalGas: `${renderFromWei(totalGas)} ${ticker}`,
    txChainId,
  };

  if (primaryCurrency === 'ETH') {
    transactionDetails = {
      ...transactionDetails,
      summaryAmount: `${renderFromWei(value)} ${ticker}`,
      summaryFee: `${renderFromWei(totalGas)} ${ticker}`,
      summarySecondaryTotalAmount: weiToFiat(
        totalEth,
        conversionRate,
        currentCurrency,
      ),
      summaryTotalAmount: `${renderFromWei(totalEth)} ${ticker}`,
    };
  } else {
    transactionDetails = {
      ...transactionDetails,
      summaryAmount: weiToFiat(value, conversionRate, currentCurrency),
      summaryFee: weiToFiat(totalGas, conversionRate, currentCurrency),
      summarySecondaryTotalAmount: `${renderFromWei(totalEth)} ${ticker}`,
      summaryTotalAmount: weiToFiat(totalEth, conversionRate, currentCurrency),
    };
  }

  return [transactionElement, transactionDetails];
}

function decodeConfirmTx(
  args: DecodeTransactionArgs,
): [TransactionElement, TransactionDetails] {
  const {
    tx: {
      txParams,
      txParams: { value, gas, from, to },
      hash,
    },
    txChainId,
    networkConfigurationsByChainId,
    conversionRate,
    currentCurrency,
    actionKey,
    primaryCurrency,
    selectedAddress,
  } = args;

  const ticker =
    networkConfigurationsByChainId?.[txChainId ?? '']?.nativeCurrency;
  const totalEth = hexToBN(value);
  const renderTotalEth = `${renderFromWei(totalEth)} ${ticker}`;
  const renderTotalEthFiat = weiToFiat(
    totalEth,
    conversionRate,
    currentCurrency,
  );

  const totalGas = calculateTotalGas(txParams);
  const totalValue = isBN(totalEth) ? totalEth.add(totalGas) : totalGas;

  const renderFrom = renderFullAddress(from);
  const renderTo = renderFullAddress(to);
  const chainId = txChainId;

  const tokenList =
    Engine.context.TokenListController.state.tokensChainsCache?.[
      chainId as `0x${string}`
    ]?.data || [];
  let symbol;
  if (renderTo in tokenList) {
    symbol = tokenList[renderTo].symbol;
  }
  let transactionType;
  if (actionKey === strings('transactions.approve'))
    transactionType = TRANSACTION_TYPES.APPROVE;
  else if (actionKey === strings('transactions.increase_allowance'))
    transactionType = TRANSACTION_TYPES.INCREASE_ALLOWANCE;
  else if (actionKey === strings('transactions.set_approval_for_all'))
    transactionType = TRANSACTION_TYPES.SET_APPROVAL_FOR_ALL;
  else if (actionKey === strings('transactions.swaps_transaction'))
    transactionType = TRANSACTION_TYPES.SWAPS_TRANSACTION;
  else if (actionKey === strings('transactions.bridge_transaction'))
    transactionType = TRANSACTION_TYPES.BRIDGE_TRANSACTION;
  else if (
    actionKey === strings('transactions.smart_contract_interaction') ||
    (!actionKey?.includes(strings('transactions.sent')) &&
      !actionKey?.includes(strings('transactions.received')))
  )
    transactionType = TRANSACTION_TYPES.SITE_INTERACTION;
  else if (renderFrom === selectedAddress)
    transactionType = TRANSACTION_TYPES.SENT;
  else if (renderTo === selectedAddress)
    transactionType = TRANSACTION_TYPES.RECEIVED;
  const transactionElement = {
    renderTo,
    renderFrom,
    actionKey: symbol ? `${symbol} ${actionKey}` : actionKey,
    value: renderTotalEth,
    fiatValue: renderTotalEthFiat,
    transactionType,
  };
  let transactionDetails: TransactionDetails = {
    renderFrom,
    renderTo,
    hash,
    renderValue: `${renderFromWei(value)} ${ticker}`,
    renderGas: parseInt(gas, 16).toString(),
    renderGasPrice: renderGwei(txParams),
    renderTotalGas: `${renderFromWei(totalGas)} ${ticker}`,
    transactionType,
    txChainId,
  };

  if (primaryCurrency === 'ETH') {
    transactionDetails = {
      ...transactionDetails,
      summaryAmount: renderTotalEth,
      summaryFee: `${renderFromWei(totalGas)} ${ticker}`,
      summarySecondaryTotalAmount: weiToFiat(
        totalValue,
        conversionRate,
        currentCurrency,
      ),
      summaryTotalAmount: `${renderFromWei(totalValue)} ${ticker}`,
    };
  } else {
    transactionDetails = {
      ...transactionDetails,
      summaryAmount: weiToFiat(totalEth, conversionRate, currentCurrency),
      summaryFee: weiToFiat(totalGas, conversionRate, currentCurrency),
      summarySecondaryTotalAmount: `${renderFromWei(totalValue)} ${ticker}`,
      summaryTotalAmount: weiToFiat(
        totalValue,
        conversionRate,
        currentCurrency,
      ),
    };
  }
  return [transactionElement, transactionDetails];
}

function decodeSwapsTx(
  args: DecodeTransactionArgs,
): [TransactionElement | undefined, TransactionDetails | undefined] {
  const {
    swapsTransactions,
    swapsTokens,
    conversionRate,
    currentCurrency,
    primaryCurrency,
    networkConfigurationsByChainId,
    txChainId,
    tx: {
      id,
      txParams,
      txParams: { gas, from, to },
      hash,
    },
    tx,
    contractExchangeRates,
    assetSymbol,
    chainId,
  } = args;
  // If the tx was a swaps smart transaction, the swapsTransactions id is the stx.uuid, rather than tx.id
  // We need use the tx.hash and look up the stx with the same hash
  const smartTransaction =
    Engine.context.SmartTransactionsController.state.smartTransactionsState.smartTransactions[
      chainId as `0x${string}`
    ]?.find((stx) => stx.txHash === hash);

  const swapTransaction: SwapTransaction =
    (id ? swapsTransactions?.[id] : undefined) ||
    swapsTransactions?.[smartTransaction?.uuid as string] ||
    {};

  const totalGas = calculateTotalGas({
    ...txParams,
    gas: swapTransaction.gasUsed || gas,
  });
  const sourceToken = swapsTokens?.find(
    ({ address }) => address === swapTransaction?.sourceToken?.address,
  );
  const destinationToken =
    swapTransaction?.destinationToken?.swaps ||
    swapsTokens?.find(
      ({ address }) => address === swapTransaction?.destinationToken?.address,
    );
  if (!sourceToken || !destinationToken) return [undefined, undefined];

  const renderFrom = renderFullAddress(from);
  const renderTo = renderFullAddress(to);
  const ticker =
    networkConfigurationsByChainId?.[txChainId ?? '']?.nativeCurrency;
  const totalEthGas = renderFromWei(totalGas);
  const decimalSourceAmount =
    swapTransaction.sourceAmount &&
    renderFromTokenMinimalUnit(
      swapTransaction.sourceAmount,
      swapTransaction.sourceToken?.decimals,
    );
  const decimalDestinationAmount =
    swapTransaction.destinationToken?.decimals &&
    renderFromTokenMinimalUnit(
      !!swapTransaction?.receivedDestinationAmount &&
        swapTransaction?.receivedDestinationAmount > 0
        ? swapTransaction.receivedDestinationAmount
        : swapTransaction.destinationAmount,
      swapTransaction.destinationToken?.decimals,
    );
  let totalAmountForEthSourceTokenFormatted;
  if (sourceToken.symbol === 'ETH') {
    const totalAmountForEthSourceToken =
      Number(!isNaN(Number(totalEthGas)) ? totalEthGas : 0) +
      Number(decimalSourceAmount);
    totalAmountForEthSourceTokenFormatted = `${limitToMaximumDecimalPlaces(
      totalAmountForEthSourceToken,
    )} ${ticker}`;
  }
  const cryptoSummaryTotalAmount =
    sourceToken.symbol === 'ETH'
      ? totalAmountForEthSourceTokenFormatted
      : decimalSourceAmount
      ? `${decimalSourceAmount} ${sourceToken.symbol} + ${totalEthGas} ${ticker}`
      : `${totalEthGas} ${ticker}`;

  const isSwap = swapTransaction.action === 'swap';
  let notificationKey, actionKey, value, fiatValue;
  if (isSwap) {
    actionKey = strings('swaps.transaction_label.swap', {
      sourceToken: sourceToken.symbol,
      destinationToken: destinationToken.symbol,
    });
    notificationKey = strings(
      `swaps.notification_label.${
        tx.status === 'submitted' ? 'swap_pending' : 'swap_confirmed'
      }`,
      {
        sourceToken: sourceToken.symbol,
        destinationToken: destinationToken.symbol,
      },
    );
  } else {
    actionKey = strings('swaps.transaction_label.approve', {
      sourceToken: sourceToken.symbol,
      upTo: renderFromTokenMinimalUnit(
        swapTransaction.upTo,
        sourceToken.decimals,
      ),
    });
    notificationKey = strings(
      `swaps.notification_label.${
        tx.status === 'submitted' ? 'approve_pending' : 'approve_confirmed'
      }`,
      { sourceToken: sourceToken.symbol },
    );
  }

  const sourceExchangeRate = isSwapsNativeAsset(sourceToken)
    ? 1
    : contractExchangeRates?.[
        safeToChecksumAddress(sourceToken.address) as string
      ]?.price;
  const renderSourceTokenFiatNumber = balanceToFiatNumber(
    decimalSourceAmount,
    conversionRate,
    sourceExchangeRate,
  );

  const destinationExchangeRate = isSwapsNativeAsset(destinationToken)
    ? 1
    : contractExchangeRates?.[
        safeToChecksumAddress(destinationToken.address) as string
      ]?.price;
  const renderDestinationTokenFiatNumber = balanceToFiatNumber(
    decimalDestinationAmount,
    conversionRate,
    destinationExchangeRate,
  );

  if (isSwap) {
    if (!assetSymbol || sourceToken.symbol === assetSymbol) {
      value = `-${decimalSourceAmount} ${sourceToken.symbol}`;
      fiatValue = addCurrencySymbol(
        renderSourceTokenFiatNumber,
        currentCurrency,
      );
    } else {
      value = `+${decimalDestinationAmount} ${destinationToken.symbol}`;
      fiatValue = addCurrencySymbol(
        renderDestinationTokenFiatNumber,
        currentCurrency,
      );
    }
  }
  const transactionElement = {
    renderTo,
    renderFrom,
    actionKey,
    notificationKey,
    value,
    fiatValue,
    transactionType: isSwap
      ? TRANSACTION_TYPES.SITE_INTERACTION
      : TRANSACTION_TYPES.APPROVE,
  };

  let transactionDetails: TransactionDetails = {
    renderFrom,
    renderTo,
    hash,
    renderValue: decimalSourceAmount
      ? `${decimalSourceAmount} ${sourceToken.symbol}`
      : `0 ${ticker}`,
    renderGas: parseInt(gas, 16),
    renderGasPrice: renderGwei(txParams),
    renderTotalGas: `${totalEthGas} ${ticker}`,
    txChainId,
  };

  if (primaryCurrency === 'ETH') {
    transactionDetails = {
      ...transactionDetails,
      summaryAmount: isSwap
        ? `${decimalSourceAmount} ${sourceToken.symbol}`
        : `0 ${ticker}`,
      summaryFee: `${totalEthGas} ${ticker}`,
      summaryTotalAmount: cryptoSummaryTotalAmount,
      summarySecondaryTotalAmount: addCurrencySymbol(
        renderSourceTokenFiatNumber + weiToFiatNumber(totalGas, conversionRate),
        currentCurrency,
      ),
    };
  } else {
    transactionDetails = {
      ...transactionDetails,
      summaryAmount: addCurrencySymbol(
        renderSourceTokenFiatNumber,
        currentCurrency,
      ),
      summaryFee: weiToFiat(totalGas, conversionRate, currentCurrency),
      summaryTotalAmount: addCurrencySymbol(
        renderSourceTokenFiatNumber + weiToFiatNumber(totalGas, conversionRate),
        currentCurrency,
      ),
      summarySecondaryTotalAmount: cryptoSummaryTotalAmount,
    };
  }
  return [transactionElement, transactionDetails];
}

/**
 * Parse transaction with wallet information to render
 *
 * @param {*} args - Should contain tx, selectedAddress, ticker, conversionRate,
 * currentCurrency, exchangeRate, contractExchangeRates, collectibleContracts, tokens
 */
export default async function decodeTransaction(
  args: DecodeTransactionArgs,
): Promise<
  [TransactionElement | undefined, TransactionDetails | undefined]
> {
  const {
    tx,
    selectedAddress,
    chainId,
    networkConfigurationsByChainId,
    txChainId,
    swapsTransactions = {},
  } = args;
  const ticker =
    networkConfigurationsByChainId?.[txChainId ?? '']?.nativeCurrency;
  const chainIdToUse = tx.chainId || chainId;
  const { isTransfer } = tx || {};

  const actionKey = await getActionKey(
    tx,
    selectedAddress as string,
    ticker,
    chainIdToUse,
  );
  let transactionElement: TransactionElement | undefined;
  let transactionDetails: TransactionDetails | undefined;

  if (
    tx.txParams.to?.toLowerCase() ===
      getSwapsContractAddress(chainIdToUse as `0x${string}`) ||
    (tx.id ? swapsTransactions[tx.id] : undefined)
  ) {
    const [swapsElement, swapsDetails] = decodeSwapsTx({
      ...args,
      actionKey,
    });

    if (swapsElement && swapsDetails) return [swapsElement, swapsDetails];
  }
  if (isTransfer) {
    [transactionElement, transactionDetails] = decodeIncomingTransfer({
      ...args,
      actionKey,
    } as IncomingTransferArgs);
  } else {
    switch (actionKey) {
      case strings('transactions.sent_tokens'):
        [transactionElement, transactionDetails] = await decodeTransferTx({
          ...args,
          actionKey,
        });
        break;
      case strings('transactions.sent_collectible'):
        [transactionElement, transactionDetails] = decodeTransferFromTx({
          ...args,
          actionKey,
        });
        break;
      case strings('transactions.contract_deploy'):
        [transactionElement, transactionDetails] = decodeDeploymentTx({
          ...args,
          actionKey,
        });
        break;
      default:
        [transactionElement, transactionDetails] = decodeConfirmTx({
          ...args,
          actionKey,
        });
    }
  }
  return [transactionElement, transactionDetails];
}

export const TOKEN_CATEGORY_HASH = {
  [TransactionType.tokenMethodApprove]: true,
  [TransactionType.tokenMethodSetApprovalForAll]: true,
  [TransactionType.tokenMethodTransfer]: true,
  [TransactionType.tokenMethodTransferFrom]: true,
  [TransactionType.tokenMethodIncreaseAllowance]: true,
};
