import {
  hexToBN,
  weiToFiat,
  renderFromWei,
  balanceToFiat,
  renderToGwei,
  isBN,
  renderFromTokenMinimalUnit,
  fromTokenMinimalUnit,
  balanceToFiatNumber,
  weiToFiatNumber,
  addCurrencySymbol,
  BNToHex,
  limitToMaximumDecimalPlaces,
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
import { swapsUtils } from '@metamask/swaps-controller';
import { isSwapsNativeAsset } from '../Swaps/utils';
import { toLowerCaseEquals } from '../../../util/general';
import Engine from '../../../core/Engine';
import {
  isEIP1559Transaction,
  TransactionType,
} from '@metamask/transaction-controller';

interface TransactionParams {
  from: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  estimatedBaseFee: string;
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
  multiLayerL1FeeTotal: string;
  nonce?: string;
  estimatedGasLimit?: string;
  [key: string]: unknown;
}

interface Token {
  address: string;
  symbol: string;
  decimals: number;
  swaps?: boolean;
}

interface Collectible {
  address: string;
  name: string;
  symbol: string;
}

interface TransferInformation {
  symbol: string;
  decimals: number;
  contractAddress: string;
}

interface Transaction {
  id: string;
  chainId?: string;
  hash: string;
  status?: string;
  isTransfer?: boolean;
  txParams: TransactionParams;
  transferInformation: TransferInformation;
  [key: string]: unknown;
}

interface NetworkConfiguration {
  nativeCurrency?: string;
}

interface ContractExchangeRate {
  price: number;
}

interface SwapToken extends Token {
  swaps?: boolean;
}

interface SwapTransaction {
  gasUsed?: string;
  action?: string;
  sourceAmount?: string;
  destinationAmount?: string;
  receivedDestinationAmount?: string;
  upTo?: string;
  sourceToken: Token;
  destinationToken: Token;
  [key: string]: unknown;
}

export interface DecodeTransactionArgs {
  tx: Transaction;
  selectedAddress: string;
  chainId: string;
  txChainId: string;
  networkConfigurationsByChainId: Record<string, NetworkConfiguration>;
  conversionRate: number;
  currentCurrency: string;
  primaryCurrency: string;
  tokens: Record<string, Token>;
  collectibleContracts: Collectible[];
  contractExchangeRates: Record<string, ContractExchangeRate>;
  swapsTransactions?: Record<string, SwapTransaction>;
  swapsTokens?: SwapToken[];
  assetSymbol?: string;
  actionKey?: string;
  totalGas: ReturnType<typeof hexToBN>;
}

export interface TransactionElementData {
  actionKey?: string;
  notificationKey?: string;
  renderFrom?: string;
  renderTo?: string;
  value?: string;
  fiatValue?: string | number | boolean;
  transactionType?: string;
  isIncomingTransfer?: boolean;
  contractDeployment?: boolean;
  nonce?: string | number;
}

export interface TransactionDetailsData {
  renderFrom?: string;
  renderTo?: string;
  renderValue?: string;
  renderGas?: string | number;
  renderGasPrice?: string | number;
  renderTotalGas?: string;
  summaryAmount?: string;
  summaryFee?: string;
  summaryTotalAmount?: string;
  summarySecondaryTotalAmount?: string;
  hash?: string;
  transactionType?: string;
  txChainId?: string;
  [key: string]: unknown;
}

type DecodeResult = [
  TransactionElementData | undefined,
  TransactionDetailsData | undefined,
];

const { getSwapsContractAddress } = swapsUtils;

function calculateTotalGas(transaction: TransactionParams) {
  const {
    gas,
    gasPrice,
    gasUsed,
    estimatedBaseFee,
    maxPriorityFeePerGas,
    maxFeePerGas,
    multiLayerL1FeeTotal,
  } = transaction;
  if (isEIP1559Transaction(transaction)) {
    const eip1559GasHex = calculateEIP1559GasFeeHexes({
      gasLimitHex: gasUsed || gas || '0x0',
      estimatedGasLimitHex: gasUsed || gas || '0x0',
      estimatedBaseFeeHex: estimatedBaseFee || '0x0',
      suggestedMaxPriorityFeePerGasHex: maxPriorityFeePerGas || '0x0',
      suggestedMaxFeePerGasHex: maxFeePerGas || '0x0',
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

function renderGwei(transaction: TransactionParams) {
  const {
    gasPrice,
    estimatedBaseFee,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gas,
  } = transaction;

  if (isEIP1559Transaction(transaction)) {
    const eip1559GasHex = calculateEIP1559GasFeeHexes({
      gasLimitHex: gas || '0x0',
      estimatedGasLimitHex: gas || '0x0',
      estimatedBaseFeeHex: estimatedBaseFee || '0x0',
      suggestedMaxPriorityFeePerGasHex: maxPriorityFeePerGas || '0x0',
      suggestedMaxFeePerGasHex: maxFeePerGas || '0x0',
    });

    return renderToGwei(
      String(
        eip1559GasHex.estimatedBaseFee_PLUS_suggestedMaxPriorityFeePerGasHex,
      ),
    );
  }
  return renderToGwei(gasPrice);
}

function getTokenTransfer(args: DecodeTransactionArgs): DecodeResult {
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

  const [, , encodedAmount] = decodeTransferData('transfer', data) ?? [];
  const amount = hexToBN(encodedAmount);
  const tokenAddress = safeToChecksumAddress(to as string) ?? '';
  const userHasToken = tokenAddress in tokens;
  const token = userHasToken ? tokens[tokenAddress] : null;
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
      fromTokenMinimalUnit(amount, token?.decimals as number) || 0,
      conversionRate,
      exchangeRate,
      currentCurrency,
    );
    renderTokenFiatNumber = balanceToFiatNumber(
      fromTokenMinimalUnit(amount, token?.decimals as number) || 0,
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

  const ticker = networkConfigurationsByChainId?.[txChainId]?.nativeCurrency;

  let transactionDetails: TransactionDetailsData = {
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

function getCollectibleTransfer(args: DecodeTransactionArgs): DecodeResult {
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
  const [, tokenId] = decodeTransferData('transfer', data) ?? [];
  const ticker = networkConfigurationsByChainId?.[txChainId]?.nativeCurrency;
  const collectible = collectibleContracts.find((item) =>
    toLowerCaseEquals(item.address, to),
  );
  if (collectible) {
    actionKey = `${strings('transactions.sent')} ${collectible.name}`;
  } else {
    actionKey = strings('transactions.sent_collectible');
  }

  const renderCollectible = collectible
    ? `${strings('unit.token_id')} ${tokenId} ${collectible.symbol}`
    : `${strings('unit.token_id')} ${tokenId}`;

  let transactionDetails: TransactionDetailsData = {
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
  args: DecodeTransactionArgs,
): DecodeResult {
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
      ? contractExchangeRates[toChecksumAddress(token.address)]?.price
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

  const ticker = networkConfigurationsByChainId?.[txChainId]?.nativeCurrency;

  const { SENT_TOKEN, RECEIVED_TOKEN } = TRANSACTION_TYPES;
  const transactionType =
    renderFullAddress(from) === selectedAddress ? SENT_TOKEN : RECEIVED_TOKEN;

  let transactionDetails: TransactionDetailsData = {
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
): Promise<DecodeResult> {
  const {
    tx: {
      txParams,
      txParams: { from, gas, data, to },
      hash,
    },
    txChainId,
  } = args;

  const decodedData = decodeTransferData('transfer', data) ?? [];
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
  let [transactionElement, transactionDetails] = isCollectible
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

function decodeTransferFromTx(args: DecodeTransactionArgs): DecodeResult {
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
  const [addressFrom, addressTo, tokenId] =
    decodeTransferData('transferFrom', data) ?? [];
  const collectible = collectibleContracts.find((item) =>
    toLowerCaseEquals(item.address, to),
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
  const ticker = networkConfigurationsByChainId?.[txChainId]?.nativeCurrency;

  const { SENT_COLLECTIBLE, RECEIVED_COLLECTIBLE } = TRANSACTION_TYPES;
  const transactionType =
    renderFrom === selectedAddress ? SENT_COLLECTIBLE : RECEIVED_COLLECTIBLE;

  let transactionDetails: TransactionDetailsData = {
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

function decodeDeploymentTx(args: DecodeTransactionArgs): DecodeResult {
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
  const ticker = networkConfigurationsByChainId?.[txChainId]?.nativeCurrency;

  const totalGas = calculateTotalGas(txParams);
  const renderTotalEth = `${renderFromWei(totalGas)} ${ticker}`;
  const renderTotalEthFiat = weiToFiat(
    totalGas,
    conversionRate,
    currentCurrency,
  );
  const totalEth = isBN(value)
    ? (value as unknown as ReturnType<typeof hexToBN>).add(totalGas)
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
  let transactionDetails: TransactionDetailsData = {
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
      summaryAmount: weiToFiat(hexToBN(value), conversionRate, currentCurrency),
      summaryFee: weiToFiat(totalGas, conversionRate, currentCurrency),
      summarySecondaryTotalAmount: `${renderFromWei(totalEth)} ${ticker}`,
      summaryTotalAmount: weiToFiat(totalEth, conversionRate, currentCurrency),
    };
  }

  return [transactionElement, transactionDetails];
}

function decodeConfirmTx(args: DecodeTransactionArgs): DecodeResult {
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

  const ticker = networkConfigurationsByChainId?.[txChainId]?.nativeCurrency;
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
    (
      Engine.context.TokenListController.state
        .tokensChainsCache as unknown as Record<
        string,
        { data?: Record<string, Token> }
      >
    )?.[chainId]?.data || {};
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
    (!(actionKey as string).includes(strings('transactions.sent')) &&
      !(actionKey as string).includes(strings('transactions.received')))
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
  let transactionDetails: TransactionDetailsData = {
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

function decodeSwapsTx(args: DecodeTransactionArgs): DecodeResult {
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
  const smartTransactions = Engine.context.SmartTransactionsController.state
    .smartTransactionsState.smartTransactions as unknown as Record<
    string,
    { txHash?: string; uuid: string }[]
  >;
  const smartTransaction = smartTransactions[chainId]?.find(
    (stx) => stx.txHash === hash,
  );

  const swapTransaction = (swapsTransactions?.[id] ||
    (smartTransaction?.uuid && swapsTransactions?.[smartTransaction.uuid]) ||
    {}) as unknown as SwapTransaction;

  const totalGas = calculateTotalGas({
    ...txParams,
    gas: swapTransaction.gasUsed || gas,
  });
  const sourceToken = swapsTokens?.find(
    ({ address }) => address === swapTransaction?.sourceToken?.address,
  );
  const destinationToken = swapTransaction?.destinationToken?.swaps
    ? swapTransaction.destinationToken
    : swapsTokens?.find(
        ({ address }) => address === swapTransaction?.destinationToken?.address,
      );
  if (!sourceToken || !destinationToken) return [undefined, undefined];

  const renderFrom = renderFullAddress(from);
  const renderTo = renderFullAddress(to);
  const ticker = networkConfigurationsByChainId?.[txChainId]?.nativeCurrency;
  const totalEthGas = renderFromWei(totalGas);
  const decimalSourceAmount =
    swapTransaction.sourceAmount &&
    renderFromTokenMinimalUnit(
      swapTransaction.sourceAmount,
      swapTransaction.sourceToken.decimals,
    );
  const decimalDestinationAmount =
    swapTransaction.destinationToken.decimals &&
    renderFromTokenMinimalUnit(
      (!!swapTransaction?.receivedDestinationAmount &&
      (swapTransaction?.receivedDestinationAmount as unknown as number) > 0
        ? swapTransaction.receivedDestinationAmount
        : swapTransaction.destinationAmount) as string,
      swapTransaction.destinationToken.decimals,
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
        swapTransaction.upTo as string,
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
    decimalSourceAmount as string,
    conversionRate,
    sourceExchangeRate,
  );

  const destinationExchangeRate = isSwapsNativeAsset(destinationToken)
    ? 1
    : contractExchangeRates?.[
        safeToChecksumAddress(destinationToken.address) as string
      ]?.price;
  const renderDestinationTokenFiatNumber = balanceToFiatNumber(
    decimalDestinationAmount as string,
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

  let transactionDetails: TransactionDetailsData = {
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
): Promise<DecodeResult> {
  const {
    tx,
    selectedAddress,
    chainId,
    networkConfigurationsByChainId,
    txChainId,
    swapsTransactions = {},
  } = args;
  const ticker = networkConfigurationsByChainId?.[txChainId]?.nativeCurrency;
  const chainIdToUse = tx.chainId || chainId;
  const { isTransfer } = tx || {};

  const actionKey = await getActionKey(
    tx,
    selectedAddress,
    ticker,
    chainIdToUse,
  );
  let transactionElement, transactionDetails;

  if (
    tx.txParams.to?.toLowerCase() ===
      getSwapsContractAddress(chainIdToUse as `0x${string}`) ||
    swapsTransactions[tx.id]
  ) {
    const [swapsTransactionElement, swapsTransactionDetails] = decodeSwapsTx({
      ...args,
      actionKey,
    });

    if (swapsTransactionElement && swapsTransactionDetails)
      return [swapsTransactionElement, swapsTransactionDetails];
  }
  if (isTransfer) {
    [transactionElement, transactionDetails] = decodeIncomingTransfer({
      ...args,
      actionKey,
    });
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
