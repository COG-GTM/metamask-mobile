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
import type { SwapsToken } from '@metamask/swaps-controller/dist/types';
import type { Token } from '@metamask/assets-controllers';
import BN from 'bnjs4';
import type { Hex } from '@metamask/utils';
import type { SwapsTransaction } from '../../../util/swaps/swaps-transactions';

const { getSwapsContractAddress } = swapsUtils;

export interface DecodableTxParams {
  from: string;
  to?: string;
  data?: string;
  value?: string;
  nonce?: string;
  gas?: string;
  gasPrice?: string;
  gasUsed?: string;
  estimatedBaseFee?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  multiLayerL1FeeTotal?: string;
  [key: string]: unknown;
}

export interface DecodableTransferInformation {
  symbol: string;
  decimals: number;
  contractAddress: string;
}

/**
 * Loosely-typed transaction as rendered by the activity list. Transactions may
 * come from the TransactionController or from incoming-transfer imports, so
 * only the fields the UI reads are declared.
 */
export interface TransactionObject {
  id?: string;
  hash?: string;
  status?: string;
  chainId?: string;
  isTransfer?: boolean;
  time?: number;
  type?: string;
  networkID?: string;
  deviceConfirmedOn?: string;
  insertImportTime?: boolean;
  isSmartTransaction?: boolean;
  txParams?: DecodableTxParams;
  transferInformation?: DecodableTransferInformation;
  [key: string]: unknown;
}

export interface DecodableTransaction extends TransactionObject {
  txParams: DecodableTxParams;
}

export interface DecodableCollectibleContract {
  address?: string;
  name?: string;
  symbol?: string;
}

export type DecodableToken = Pick<Token, 'address' | 'symbol' | 'decimals'>;

export type ContractExchangeRates = Record<
  string,
  { price?: number } | undefined
>;

export interface DecodeTransactionArgs {
  tx: DecodableTransaction;
  txChainId?: string;
  chainId?: string;
  selectedAddress: string;
  networkConfigurationsByChainId?: Record<
    string,
    { nativeCurrency?: string } | undefined
  >;
  conversionRate?: number | null;
  currentCurrency: string;
  primaryCurrency: string;
  tokens?: Record<string, DecodableToken | undefined>;
  contractExchangeRates: ContractExchangeRates;
  collectibleContracts?: DecodableCollectibleContract[];
  swapsTransactions?: Record<string, SwapsTransaction | undefined>;
  swapsTokens?: SwapsToken[] | null;
  assetSymbol?: string;
  actionKey?: string;
}

interface DecodeArgs extends DecodeTransactionArgs {
  actionKey: string;
}

interface TransferArgs extends DecodeArgs {
  totalGas?: BN | string;
}

export interface TransactionElementInfo {
  actionKey?: string;
  notificationKey?: string;
  value?: string;
  fiatValue?: string | false;
  renderFrom?: string;
  renderTo?: string;
  transactionType?: string;
  nonce?: string;
  isIncomingTransfer?: boolean;
  contractDeployment?: boolean;
}

export interface TransactionDetailsInfo {
  renderFrom?: string;
  renderTo?: string;
  hash?: string;
  renderValue?: string;
  renderGas?: string | number;
  renderGasPrice?: string;
  renderTotalGas?: string;
  transactionType?: string;
  txChainId?: string;
  summaryAmount?: string;
  summaryFee?: string;
  summaryTotalAmount?: string;
  summarySecondaryTotalAmount?: string;
  [key: string]: unknown;
}

export type DecodedTransaction = [
  TransactionElementInfo | undefined,
  TransactionDetailsInfo | undefined,
];

// weiToFiat only formats BN input; any other input renders as a zero amount.
const weiInputToFiat = (
  wei: BN | string | number | undefined,
  conversionRate: number | null | undefined,
  currentCurrency: string,
): string | undefined =>
  weiToFiat(BN.isBN(wei) ? wei : 0, conversionRate, currentCurrency);

const getExchangeRate = (
  contractExchangeRates: ContractExchangeRates | undefined,
  address: string | undefined,
): number | undefined =>
  contractExchangeRates && address !== undefined
    ? contractExchangeRates[address]?.price
    : undefined;

function calculateTotalGas(transaction: DecodableTxParams): BN {
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

function renderGwei(transaction: DecodableTxParams): string {
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
      estimatedGasLimitHex: undefined,
      estimatedBaseFeeHex: estimatedBaseFee || '0x0',
      suggestedMaxPriorityFeePerGasHex: maxPriorityFeePerGas,
      suggestedMaxFeePerGasHex: maxFeePerGas,
    });

    const gasPriceHex =
      eip1559GasHex.estimatedBaseFee_PLUS_suggestedMaxPriorityFeePerGasHex;
    return renderToGwei(
      typeof gasPriceHex === 'string' ? gasPriceHex : gasPriceHex.toString(16),
    );
  }
  return renderToGwei(gasPrice ?? '');
}

function getTokenTransfer(args: TransferArgs): DecodedTransaction {
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
    totalGas = 0,
    actionKey,
    primaryCurrency,
    selectedAddress,
  } = args;

  const [, , encodedAmount] = decodeTransferData('transfer', data ?? '');
  const amount = hexToBN(encodedAmount);
  const checksummedTo = safeToChecksumAddress(to ?? '');
  const token =
    tokens && checksummedTo !== undefined && checksummedTo in tokens
      ? tokens[checksummedTo]
      : null;
  const renderActionKey = token
    ? `${strings('transactions.sent')} ${token.symbol}`
    : actionKey;
  const renderTokenAmount = token
    ? `${renderFromTokenMinimalUnit(amount, token.decimals)} ${token.symbol}`
    : undefined;
  const exchangeRate = token
    ? getExchangeRate(contractExchangeRates, token.address)
    : undefined;
  let renderTokenFiatAmount: string | undefined;
  let renderTokenFiatNumber: number | undefined;
  if (token && exchangeRate) {
    renderTokenFiatAmount = balanceToFiat(
      fromTokenMinimalUnit(amount, token.decimals) || 0,
      conversionRate,
      exchangeRate,
      currentCurrency,
    );
    renderTokenFiatNumber = balanceToFiatNumber(
      fromTokenMinimalUnit(amount, token.decimals) || 0,
      Number(conversionRate),
      exchangeRate,
    );
  }

  const renderToken = token
    ? `${renderFromTokenMinimalUnit(amount, token.decimals)} ${token.symbol}`
    : strings('transaction.value_not_available');
  const totalFiatNumber = renderTokenFiatNumber
    ? weiToFiatNumber(totalGas, Number(conversionRate)) + renderTokenFiatNumber
    : weiToFiatNumber(totalGas, Number(conversionRate));

  const ticker =
    networkConfigurationsByChainId?.[txChainId ?? '']?.nativeCurrency;

  let transactionDetails: TransactionDetailsInfo = {
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
      summaryFee: weiInputToFiat(totalGas, conversionRate, currentCurrency),
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
  const transactionElement: TransactionElementInfo = {
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

function getCollectibleTransfer(args: TransferArgs): DecodedTransaction {
  const {
    tx: {
      txParams: { from, to, data },
    },
    txChainId,
    networkConfigurationsByChainId,
    collectibleContracts,
    totalGas = 0,
    conversionRate,
    currentCurrency,
    primaryCurrency,
    selectedAddress,
  } = args;
  let actionKey: string;
  const [, tokenId] = decodeTransferData('transfer', data ?? '');
  const ticker =
    networkConfigurationsByChainId?.[txChainId ?? '']?.nativeCurrency;
  const collectible = collectibleContracts?.find((contract) =>
    toLowerCaseEquals(contract.address, to),
  );
  if (collectible) {
    actionKey = `${strings('transactions.sent')} ${collectible.name}`;
  } else {
    actionKey = strings('transactions.sent_collectible');
  }

  const renderCollectible = collectible
    ? `${strings('unit.token_id')} ${tokenId} ${collectible.symbol}`
    : `${strings('unit.token_id')} ${tokenId}`;

  let transactionDetails: TransactionDetailsInfo = {
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
      summarySecondaryTotalAmount: weiInputToFiat(
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
      summaryFee: weiInputToFiat(totalGas, conversionRate, currentCurrency),
      summaryTotalAmount: weiInputToFiat(
        totalGas,
        conversionRate,
        currentCurrency,
      ),
      summarySecondaryTotalAmount: `${renderCollectible} ${strings(
        'unit.divisor',
      )} ${renderFromWei(totalGas)} ${strings('unit.eth')}`,
      txChainId,
    };
  }

  let transactionType: string;
  if (renderFullAddress(from) === selectedAddress)
    transactionType = TRANSACTION_TYPES.SENT_COLLECTIBLE;
  else transactionType = TRANSACTION_TYPES.RECEIVED_COLLECTIBLE;

  const transactionElement: TransactionElementInfo = {
    actionKey,
    value: `${strings('unit.token_id')}${tokenId}`,
    fiatValue: collectible ? collectible.symbol : undefined,
    transactionType,
  };

  return [transactionElement, transactionDetails];
}

export function decodeIncomingTransfer(args: TransferArgs): DecodedTransaction {
  const {
    tx: {
      txParams: { to, from, value },
      transferInformation,
      hash,
    },
    txChainId,
    networkConfigurationsByChainId,
    conversionRate,
    currentCurrency,
    contractExchangeRates,
    totalGas = 0,
    actionKey,
    primaryCurrency,
    selectedAddress,
  } = args;

  const amount = hexToBN(value);
  const token = transferInformation
    ? {
        symbol: transferInformation.symbol,
        decimals: transferInformation.decimals,
        address: transferInformation.contractAddress,
      }
    : undefined;

  const renderTokenAmount = token
    ? `${renderFromTokenMinimalUnit(amount, token.decimals)} ${token.symbol}`
    : undefined;
  const exchangeRate = token
    ? getExchangeRate(contractExchangeRates, toChecksumAddress(token.address))
    : undefined;

  let renderTokenFiatAmount: string | undefined;
  let renderTokenFiatNumber: number | undefined;
  if (token && exchangeRate) {
    renderTokenFiatAmount = balanceToFiat(
      fromTokenMinimalUnit(amount, token.decimals) || 0,
      conversionRate,
      exchangeRate,
      currentCurrency,
    );

    renderTokenFiatNumber = balanceToFiatNumber(
      fromTokenMinimalUnit(amount, token.decimals) || 0,
      Number(conversionRate),
      exchangeRate,
    );
  }

  const renderToken = token
    ? `${renderFromTokenMinimalUnit(amount, token.decimals)} ${token.symbol}`
    : strings('transaction.value_not_available');
  const totalFiatNumber = renderTokenFiatNumber
    ? weiToFiatNumber(totalGas, Number(conversionRate)) + renderTokenFiatNumber
    : weiToFiatNumber(totalGas, Number(conversionRate));

  const ticker =
    networkConfigurationsByChainId?.[txChainId ?? '']?.nativeCurrency;

  const { SENT_TOKEN, RECEIVED_TOKEN } = TRANSACTION_TYPES;
  const transactionType =
    renderFullAddress(from) === selectedAddress ? SENT_TOKEN : RECEIVED_TOKEN;

  let transactionDetails: TransactionDetailsInfo = {
    renderTotalGas: `${renderFromWei(totalGas)} ${ticker}`,
    renderValue: renderToken,
    renderFrom: renderFullAddress(from),
    renderTo: renderFullAddress(to ?? ''),
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
      summaryFee: weiInputToFiat(totalGas, conversionRate, currentCurrency),
      summaryTotalAmount: totalFiatNumber
        ? `${addCurrencySymbol(totalFiatNumber, currentCurrency)}`
        : undefined,
      summarySecondaryTotalAmount: `${renderToken} ${strings(
        'unit.divisor',
      )} ${renderFromWei(totalGas)} ${ticker}`,
    };
  }

  const transactionElement: TransactionElementInfo = {
    actionKey,
    renderFrom: renderFullAddress(from),
    renderTo: renderFullAddress(to ?? ''),
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

async function decodeTransferTx(args: DecodeArgs): Promise<DecodedTransaction> {
  const {
    tx: {
      txParams,
      txParams: { from, gas, data, to },
      hash,
    },
    txChainId,
  } = args;

  const decodedData = decodeTransferData('transfer', data ?? '');
  const addressTo = decodedData[0];
  let isCollectible = false;
  try {
    isCollectible = await isCollectibleAddress(to ?? '', decodedData[1]);
  } catch (e) {
    //
  }

  const totalGas = calculateTotalGas(txParams);
  const renderGas = parseInt(String(gas), 16).toString();
  const renderGasPrice = renderGwei(txParams);
  const [transactionElement, transactionDetails] = isCollectible
    ? getCollectibleTransfer({ ...args, totalGas })
    : getTokenTransfer({ ...args, totalGas });
  return [
    { ...transactionElement, renderTo: addressTo },
    {
      ...transactionDetails,
      renderFrom: renderFullAddress(from),
      renderTo: renderFullAddress(addressTo),
      hash,
      renderGas,
      renderGasPrice,
      txChainId,
    },
  ];
}

function decodeTransferFromTx(args: DecodeArgs): DecodedTransaction {
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
    data ?? '',
  );
  const collectible = collectibleContracts?.find((contract) =>
    toLowerCaseEquals(contract.address, to),
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

  let transactionDetails: TransactionDetailsInfo = {
    renderFrom,
    renderTo,
    hash,
    renderValue: renderCollectible,
    renderGas: parseInt(String(gas), 16).toString(),
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
      summaryFee: weiInputToFiat(totalGas, conversionRate, currentCurrency),
      summarySecondaryTotalAmount: `${renderCollectible} ${strings(
        'unit.divisor',
      )} ${renderFromWei(totalGas)} ${ticker}`,
      summaryTotalAmount: weiInputToFiat(
        totalGas,
        conversionRate,
        currentCurrency,
      ),
      transactionType,
    };
  }

  const transactionElement: TransactionElementInfo = {
    renderTo,
    renderFrom,
    actionKey,
    value: `${strings('unit.token_id')}${tokenId}`,
    fiatValue: collectible ? collectible.symbol : undefined,
    transactionType,
  };

  return [transactionElement, transactionDetails];
}

function decodeDeploymentTx(args: DecodeArgs): DecodedTransaction {
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
  const totalEth = isBN(value ?? '')
    ? hexToBN(value ?? '').add(totalGas)
    : totalGas;

  const renderFrom = renderFullAddress(from);
  const renderTo = strings('transactions.to_contract');

  const transactionElement: TransactionElementInfo = {
    renderTo,
    renderFrom,
    actionKey,
    value: renderTotalEth,
    fiatValue: renderTotalEthFiat,
    contractDeployment: true,
    transactionType: TRANSACTION_TYPES.SITE_INTERACTION,
  };
  let transactionDetails: TransactionDetailsInfo = {
    renderFrom,
    renderTo,
    hash,
    renderValue: `${renderFromWei(value ?? '')} ${ticker}`,
    renderGas: parseInt(String(gas), 16).toString(),
    renderGasPrice: renderGwei(txParams),
    renderTotalGas: `${renderFromWei(totalGas)} ${ticker}`,
    txChainId,
  };

  if (primaryCurrency === 'ETH') {
    transactionDetails = {
      ...transactionDetails,
      summaryAmount: `${renderFromWei(value ?? '')} ${ticker}`,
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
      summaryAmount: weiInputToFiat(value, conversionRate, currentCurrency),
      summaryFee: weiInputToFiat(totalGas, conversionRate, currentCurrency),
      summarySecondaryTotalAmount: `${renderFromWei(totalEth)} ${ticker}`,
      summaryTotalAmount: weiToFiat(totalEth, conversionRate, currentCurrency),
    };
  }

  return [transactionElement, transactionDetails];
}

function decodeConfirmTx(args: DecodeArgs): DecodedTransaction {
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
  const renderTo = renderFullAddress(to ?? '');
  const chainId = txChainId;

  const tokenList =
    (chainId !== undefined
      ? Engine.context.TokenListController.state.tokensChainsCache?.[
          chainId as Hex
        ]?.data
      : undefined) || [];
  let symbol: string | undefined;
  if (!Array.isArray(tokenList) && renderTo in tokenList) {
    symbol = tokenList[renderTo].symbol;
  }
  let transactionType: string | undefined;
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
  const transactionElement: TransactionElementInfo = {
    renderTo,
    renderFrom,
    actionKey: symbol ? `${symbol} ${actionKey}` : actionKey,
    value: renderTotalEth,
    fiatValue: renderTotalEthFiat,
    transactionType,
  };
  let transactionDetails: TransactionDetailsInfo = {
    renderFrom,
    renderTo,
    hash,
    renderValue: `${renderFromWei(value ?? '')} ${ticker}`,
    renderGas: parseInt(String(gas), 16).toString(),
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
      summaryFee: weiInputToFiat(totalGas, conversionRate, currentCurrency),
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

function decodeSwapsTx(args: DecodeArgs): DecodedTransaction {
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
    chainId !== undefined
      ? Engine.context.SmartTransactionsController.state.smartTransactionsState.smartTransactions[
          chainId as `0x${string}`
        ]?.find((stx) => stx.txHash === hash)
      : undefined;

  const swapTransaction: SwapsTransaction =
    (id !== undefined ? swapsTransactions?.[id] : undefined) ||
    (smartTransaction?.uuid !== undefined
      ? swapsTransactions?.[smartTransaction.uuid]
      : undefined) ||
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
  const renderTo = renderFullAddress(to ?? '');
  const ticker =
    networkConfigurationsByChainId?.[txChainId ?? '']?.nativeCurrency;
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
      !!swapTransaction?.receivedDestinationAmount &&
        swapTransaction?.receivedDestinationAmount > 0
        ? swapTransaction.receivedDestinationAmount
        : swapTransaction.destinationAmount,
      swapTransaction.destinationToken.decimals,
    );
  let totalAmountForEthSourceTokenFormatted: string | undefined;
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
  let notificationKey: string;
  let actionKey: string;
  let value: string | undefined;
  let fiatValue: string | undefined;
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
    : getExchangeRate(
        contractExchangeRates,
        safeToChecksumAddress(sourceToken.address),
      );
  const renderSourceTokenFiatNumber = balanceToFiatNumber(
    decimalSourceAmount,
    Number(conversionRate),
    Number(sourceExchangeRate),
  );

  const destinationExchangeRate = isSwapsNativeAsset(destinationToken)
    ? 1
    : getExchangeRate(
        contractExchangeRates,
        safeToChecksumAddress(destinationToken.address),
      );
  const renderDestinationTokenFiatNumber = balanceToFiatNumber(
    decimalDestinationAmount,
    Number(conversionRate),
    Number(destinationExchangeRate),
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
  const transactionElement: TransactionElementInfo = {
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

  let transactionDetails: TransactionDetailsInfo = {
    renderFrom,
    renderTo,
    hash,
    renderValue: decimalSourceAmount
      ? `${decimalSourceAmount} ${sourceToken.symbol}`
      : `0 ${ticker}`,
    renderGas: parseInt(String(gas), 16),
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
        renderSourceTokenFiatNumber +
          weiToFiatNumber(totalGas, Number(conversionRate)),
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
      summaryFee: weiInputToFiat(totalGas, conversionRate, currentCurrency),
      summaryTotalAmount: addCurrencySymbol(
        renderSourceTokenFiatNumber +
          weiToFiatNumber(totalGas, Number(conversionRate)),
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
): Promise<DecodedTransaction> {
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
    selectedAddress,
    ticker,
    chainIdToUse,
  );
  let transactionElement: TransactionElementInfo | undefined;
  let transactionDetails: TransactionDetailsInfo | undefined;

  if (
    tx.txParams.to?.toLowerCase() ===
      getSwapsContractAddress(chainIdToUse as Hex) ||
    (tx.id !== undefined && swapsTransactions[tx.id])
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
