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
  getTicker,
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

const { getSwapsContractAddress } = swapsUtils;

interface TxParams {
  from?: string;
  to?: string;
  data?: string;
  nonce?: string;
  gas?: string;
  gasPrice?: string;
  gasUsed?: string;
  estimatedBaseFee?: string;
  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
  multiLayerL1FeeTotal?: string;
  value?: string;
  [key: string]: unknown;
}

interface Tx {
  id?: string;
  hash?: string;
  chainId?: string;
  status?: string;
  isTransfer?: boolean;
  txParams: TxParams;
  transferInformation?: {
    symbol?: string;
    decimals?: number;
    contractAddress?: string;
  };
  [key: string]: unknown;
}

interface DecodeTransactionArgs {
  tx: Tx;
  selectedAddress?: string;
  txChainId?: string;
  chainId?: string;
  ticker?: string;
  conversionRate?: number;
  currentCurrency?: string;
  primaryCurrency?: string;
  actionKey?: string;
  totalGas?: unknown;
  tokens?: Record<string, { symbol?: string; decimals?: number; address?: string }>;
  contractExchangeRates?: Record<string, { price?: number } | undefined>;
  collectibleContracts?: {
    address?: string;
    name?: string;
    symbol?: string;
  }[];
  swapsTransactions?: Record<string, SwapTransaction | undefined>;
  swapsTokens?: { address?: string; symbol?: string; decimals?: number }[];
  assetSymbol?: string;
  networkConfigurationsByChainId?: Record<
    string,
    { nativeCurrency?: string } | undefined
  >;
  [key: string]: unknown;
}

interface SwapTransaction {
  action?: string;
  gasUsed?: string;
  sourceAmount?: string;
  destinationAmount?: string;
  receivedDestinationAmount?: number;
  upTo?: string;
  sourceToken?: { address?: string; decimals?: number; symbol?: string };
  destinationToken?: {
    address?: string;
    decimals?: number;
    symbol?: string;
    swaps?: { address?: string; symbol?: string; decimals?: number };
  };
  [key: string]: unknown;
}

interface TransactionDetails {
  [key: string]: unknown;
}

interface TransactionElement {
  [key: string]: unknown;
}

interface TxParamsResolved {
  from: string;
  to: string;
  data: string;
  nonce: string;
  gas: string;
  gasPrice: string;
  value: string;
  gasUsed?: string;
  estimatedBaseFee?: string;
  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
  multiLayerL1FeeTotal?: string;
  [key: string]: unknown;
}

interface ResolvedArgs {
  tx: {
    id?: string;
    hash?: string;
    chainId?: string;
    status?: string;
    isTransfer?: boolean;
    txParams: TxParamsResolved;
    transferInformation: {
      symbol: string;
      decimals: number;
      contractAddress: string;
    };
  };
  selectedAddress: string;
  txChainId: string;
  chainId: string;
  ticker: string;
  conversionRate: number;
  currentCurrency: string;
  primaryCurrency: string;
  actionKey: string;
  totalGas: ReturnType<typeof calculateTotalGas>;
  tokens: Record<
    string,
    { symbol: string; decimals: number; address: string }
  >;
  contractExchangeRates: Record<string, { price?: number } | undefined>;
  collectibleContracts: {
    address?: string;
    name?: string;
    symbol?: string;
  }[];
  swapsTransactions: Record<string, SwapTransaction | undefined>;
  swapsTokens: { address?: string; symbol?: string; decimals?: number }[];
  assetSymbol?: string;
  networkConfigurationsByChainId: Record<
    string,
    { nativeCurrency?: string } | undefined
  >;
}

function calculateTotalGas(transaction: TxParamsResolved) {
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
      gasLimitHex: gasUsed || gas,
      estimatedBaseFeeHex: estimatedBaseFee || '0x0',
      suggestedMaxPriorityFeePerGasHex: maxPriorityFeePerGas,
      suggestedMaxFeePerGasHex: maxFeePerGas,
    } as Parameters<typeof calculateEIP1559GasFeeHexes>[0]);
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

function renderGwei(transaction: TxParamsResolved) {
  const {
    gasPrice,
    estimatedBaseFee,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gas,
  } = transaction;

  if (isEIP1559Transaction(transaction)) {
    const eip1559GasHex = calculateEIP1559GasFeeHexes({
      gasLimitHex: gas,
      estimatedBaseFeeHex: estimatedBaseFee || '0x0',
      suggestedMaxPriorityFeePerGasHex: maxPriorityFeePerGas,
      suggestedMaxFeePerGasHex: maxFeePerGas,
    } as Parameters<typeof calculateEIP1559GasFeeHexes>[0]);

    return renderToGwei(
      eip1559GasHex.estimatedBaseFee_PLUS_suggestedMaxPriorityFeePerGasHex as string,
    );
  }
  return renderToGwei(gasPrice);
}

function getTokenTransfer(args: DecodeTransactionArgs) {
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
  } = args as unknown as ResolvedArgs;

  const [, , encodedAmount] = decodeTransferData('transfer', data);
  const amount = hexToBN(encodedAmount);
  const userHasToken = (safeToChecksumAddress(to) as string) in tokens;
  const token = userHasToken
    ? tokens[safeToChecksumAddress(to) as string]
    : null;
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

function getCollectibleTransfer(args: DecodeTransactionArgs) {
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
  } = args as unknown as ResolvedArgs;
  let actionKey;
  const [, tokenId] = decodeTransferData('transfer', data);
  const ticker = networkConfigurationsByChainId?.[txChainId]?.nativeCurrency;
  const collectible = collectibleContracts.find((collectible) =>
    toLowerCaseEquals(collectible.address, to),
  );
  if (collectible) {
    actionKey = `${strings('transactions.sent')} ${collectible.name}`;
  } else {
    actionKey = strings('transactions.sent_collectible');
  }

  const renderCollectible = collectible
    ? `${strings('unit.token_id')} ${tokenId} ${collectible.symbol}`
    : `${strings('unit.token_id')} ${tokenId}`;

  let transactionDetails: TransactionDetails = { renderValue: renderCollectible };

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

export function decodeIncomingTransfer(args: DecodeTransactionArgs) {
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
  } = args as unknown as ResolvedArgs;

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

async function decodeTransferTx(args: DecodeTransactionArgs) {
  const {
    tx: {
      txParams,
      txParams: { from, gas, data, to },
      hash,
    },
    txChainId,
  } = args as unknown as ResolvedArgs;

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

function decodeTransferFromTx(args: DecodeTransactionArgs) {
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
  } = args as unknown as ResolvedArgs;
  const [addressFrom, addressTo, tokenId] = decodeTransferData(
    'transferFrom',
    data,
  );
  const collectible = collectibleContracts.find((collectible) =>
    toLowerCaseEquals(collectible.address, to),
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

function decodeDeploymentTx(args: DecodeTransactionArgs) {
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
  } = args as unknown as ResolvedArgs;
  const ticker = networkConfigurationsByChainId?.[txChainId]?.nativeCurrency;

  const totalGas = calculateTotalGas(txParams);
  const renderTotalEth = `${renderFromWei(totalGas)} ${ticker}`;
  const renderTotalEthFiat = weiToFiat(
    totalGas,
    conversionRate,
    currentCurrency,
  );
  const totalEth = isBN(value)
    ? (value as unknown as ReturnType<typeof calculateTotalGas>).add(totalGas)
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
      summaryAmount: weiToFiat(
        value as unknown as ReturnType<typeof calculateTotalGas>,
        conversionRate,
        currentCurrency,
      ),
      summaryFee: weiToFiat(totalGas, conversionRate, currentCurrency),
      summarySecondaryTotalAmount: `${renderFromWei(totalEth)} ${ticker}`,
      summaryTotalAmount: weiToFiat(totalEth, conversionRate, currentCurrency),
    };
  }

  return [transactionElement, transactionDetails];
}

function decodeConfirmTx(args: DecodeTransactionArgs) {
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
  } = args as unknown as ResolvedArgs;

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

  const tokenList = (Engine.context.TokenListController.state
    .tokensChainsCache?.[chainId as `0x${string}`]?.data ||
    []) as unknown as Record<string, { symbol?: string }>;
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
    (!actionKey.includes(strings('transactions.sent')) &&
      !actionKey.includes(strings('transactions.received')))
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

function decodeSwapsTx(args: DecodeTransactionArgs) {
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
  } = args as unknown as ResolvedArgs;
  // If the tx was a swaps smart transaction, the swapsTransactions id is the stx.uuid, rather than tx.id
  // We need use the tx.hash and look up the stx with the same hash
  const smartTransaction =
    Engine.context.SmartTransactionsController.state.smartTransactionsState.smartTransactions[
      chainId as `0x${string}`
    ]?.find((stx: { txHash?: string; uuid?: string }) => stx.txHash === hash);

  const swapTransaction =
    swapsTransactions?.[id ?? ''] ||
    swapsTransactions?.[smartTransaction?.uuid ?? ''] ||
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
  const ticker = networkConfigurationsByChainId?.[txChainId]?.nativeCurrency;
  const totalEthGas = renderFromWei(totalGas);
  const decimalSourceAmount =
    swapTransaction.sourceAmount &&
    renderFromTokenMinimalUnit(
      swapTransaction.sourceAmount,
      swapTransaction.sourceToken?.decimals as number,
    );
  const decimalDestinationAmount =
    swapTransaction.destinationToken?.decimals &&
    renderFromTokenMinimalUnit(
      (!!swapTransaction?.receivedDestinationAmount &&
      swapTransaction?.receivedDestinationAmount > 0
        ? swapTransaction.receivedDestinationAmount
        : swapTransaction.destinationAmount) as string | number,
      swapTransaction.destinationToken?.decimals as number,
    );
  let totalAmountForEthSourceTokenFormatted;
  if (sourceToken.symbol === 'ETH') {
    const totalAmountForEthSourceToken =
      Number(!isNaN(totalEthGas as unknown as number) ? totalEthGas : 0) +
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
        sourceToken.decimals as number,
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
        safeToChecksumAddress(sourceToken.address as string) as string
      ]?.price;
  const renderSourceTokenFiatNumber = balanceToFiatNumber(
    decimalSourceAmount as string,
    conversionRate,
    sourceExchangeRate as number,
  );

  const destinationExchangeRate = isSwapsNativeAsset(destinationToken)
    ? 1
    : contractExchangeRates?.[
        safeToChecksumAddress(destinationToken.address as string) as string
      ]?.price;
  const renderDestinationTokenFiatNumber = balanceToFiatNumber(
    decimalDestinationAmount as string,
    conversionRate,
    destinationExchangeRate as number,
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
export default async function decodeTransaction(args: DecodeTransactionArgs) {
  const {
    tx,
    selectedAddress,
    chainId,
    networkConfigurationsByChainId,
    txChainId,
    swapsTransactions = {},
  } = args as unknown as ResolvedArgs;
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
    swapsTransactions[tx.id ?? '']
  ) {
    const [transactionElement, transactionDetails] = decodeSwapsTx({
      ...args,
      actionKey,
    });

    if (transactionElement && transactionDetails)
      return [transactionElement, transactionDetails];
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
