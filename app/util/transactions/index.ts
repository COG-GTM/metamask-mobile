import { addHexPrefix, toChecksumAddress } from 'ethereumjs-util';
import BN from 'bnjs4';
// @ts-expect-error - ethereumjs-abi does not have type declarations
import { rawEncode, rawDecode } from 'ethereumjs-abi';
import BigNumber from 'bignumber.js';
// @ts-expect-error - humanize-duration does not have type declarations
import humanizeDuration from 'humanize-duration';
import {
  query,
  isSmartContractCode,
  ERC721,
  ERC1155,
} from '@metamask/controller-utils';
import {
  isEIP1559Transaction,
  TransactionType,
  type TransactionMeta,
  type TransactionController,
} from '@metamask/transaction-controller';
import { swapsUtils } from '@metamask/swaps-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import type { Hex } from '@metamask/utils';
import type { AddressBookControllerState } from '@metamask/address-book-controller';
import Engine from '../../core/Engine';
import I18n, { strings } from '../../../locales/i18n';
import { safeToChecksumAddress } from '../address';
import {
  balanceToFiatNumber,
  BNToHex,
  hexToBN,
  renderFiatAddition,
  renderFromTokenMinimalUnit,
  renderFromWei,
  weiToFiat,
  weiToFiatNumber,
  toTokenMinimalUnit,
} from '../number';
import AppConstants from '../../core/AppConstants';
import { isMainnetByChainId } from '../networks';
import { UINT256_BN_MAX_VALUE } from '../../constants/transaction';
import { NEGATIVE_TOKEN_DECIMALS } from '../../constants/error';
import {
  addCurrencies,
  multiplyCurrencies,
  subtractCurrencies,
} from '../conversion';
import {
  decGWEIToHexWEI,
  getValueFromWeiHex,
  formatETHFee,
  sumHexWEIs,
} from '../conversions';
import {
  addEth,
  addFiat,
  convertTokenToFiat,
  formatCurrency,
  getTransactionFee,
  roundExponential,
} from '../confirm-tx';

import Logger from '../../util/Logger';
import { handleMethodData } from '../../util/transaction-controller';
import EthQuery from '@metamask/eth-query';

const { SAI_ADDRESS } = AppConstants;

export const TOKEN_METHOD_TRANSFER = 'transfer';
export const TOKEN_METHOD_APPROVE = 'approve';
export const TOKEN_METHOD_TRANSFER_FROM = 'transferfrom';
export const TOKEN_METHOD_INCREASE_ALLOWANCE = 'increaseAllowance';
export const CONTRACT_METHOD_DEPLOY = 'deploy';
export const CONNEXT_METHOD_DEPOSIT = 'connextdeposit';
export const TOKEN_METHOD_SET_APPROVAL_FOR_ALL = 'setapprovalforall';

export const SEND_ETHER_ACTION_KEY = 'sentEther';
export const DEPLOY_CONTRACT_ACTION_KEY = 'deploy';
export const APPROVE_ACTION_KEY = 'approve';
export const SEND_TOKEN_ACTION_KEY = 'transfer';
export const TRANSFER_FROM_ACTION_KEY = 'transferfrom';
export const UNKNOWN_FUNCTION_KEY = 'unknownFunction';
export const SMART_CONTRACT_INTERACTION_ACTION_KEY = 'smartContractInteraction';
export const SWAPS_TRANSACTION_ACTION_KEY = 'swapsTransaction';
export const BRIDGE_TRANSACTION_ACTION_KEY = 'bridgeTransaction';
export const INCREASE_ALLOWANCE_ACTION_KEY = 'increaseAllowance';
export const SET_APPROVE_FOR_ALL_ACTION_KEY = 'setapprovalforall';

export const TRANSFER_FUNCTION_SIGNATURE = '0xa9059cbb';
export const TRANSFER_FROM_FUNCTION_SIGNATURE = '0x23b872dd';
export const APPROVE_FUNCTION_SIGNATURE = '0x095ea7b3';
export const CONTRACT_CREATION_SIGNATURE = '0x60a060405260046060527f48302e31';
export const INCREASE_ALLOWANCE_SIGNATURE = '0x39509351';
export const SET_APPROVAL_FOR_ALL_SIGNATURE = '0xa22cb465';

export const TRANSACTION_TYPES = {
  APPROVE: 'transaction_approve',
  INCREASE_ALLOWANCE: 'transaction_increase_allowance',
  SET_APPROVAL_FOR_ALL: 'transaction_set_approval_for_all',
  RECEIVED: 'transaction_received',
  RECEIVED_COLLECTIBLE: 'transaction_received_collectible',
  RECEIVED_TOKEN: 'transaction_received_token',
  SENT: 'transaction_sent',
  SENT_COLLECTIBLE: 'transaction_sent_collectible',
  SENT_TOKEN: 'transaction_sent_token',
  SITE_INTERACTION: 'transaction_site_interaction',
  SWAPS_TRANSACTION: 'swaps_transaction',
  BRIDGE_TRANSACTION: 'bridge_transaction',
} as const;

const MULTIPLIER_HEX = 16;

const { getSwapsContractAddress } = swapsUtils;

interface CollectibleAddressCache {
  [address: string]: boolean;
}

/**
 * Utility class with the single responsibility
 * of caching CollectibleAddresses
 */
class CollectibleAddresses {
  static cache: CollectibleAddressCache = {};
}

interface ActionKeysMap {
  [key: string]: string;
}

/**
 * Object containing all known action keys, to be used in transaction review
 */
const reviewActionKeys: ActionKeysMap = {
  [SEND_TOKEN_ACTION_KEY]: strings('transactions.tx_review_transfer'),
  [SEND_ETHER_ACTION_KEY]: strings('transactions.tx_review_confirm'),
  [DEPLOY_CONTRACT_ACTION_KEY]: strings(
    'transactions.tx_review_contract_deployment',
  ),
  [TRANSFER_FROM_ACTION_KEY]: strings('transactions.tx_review_transfer_from'),
  [SMART_CONTRACT_INTERACTION_ACTION_KEY]: strings(
    'transactions.tx_review_unknown',
  ),
  [APPROVE_ACTION_KEY]: strings('transactions.tx_review_approve'),
  [INCREASE_ALLOWANCE_ACTION_KEY]: strings(
    'transactions.tx_review_increase_allowance',
  ),
  [SET_APPROVE_FOR_ALL_ACTION_KEY]: strings(
    'transactions.tx_review_set_approval_for_all',
  ),
  [TransactionType.stakingClaim]: strings(
    'transactions.tx_review_staking_claim',
  ),
  [TransactionType.stakingDeposit]: strings(
    'transactions.tx_review_staking_deposit',
  ),
  [TransactionType.stakingUnstake]: strings(
    'transactions.tx_review_staking_unstake',
  ),
};

/**
 * Object containing all known action keys, to be used in transactions list
 */
const actionKeys: ActionKeysMap = {
  [SEND_TOKEN_ACTION_KEY]: strings('transactions.sent_tokens'),
  [TRANSFER_FROM_ACTION_KEY]: strings('transactions.sent_collectible'),
  [DEPLOY_CONTRACT_ACTION_KEY]: strings('transactions.contract_deploy'),
  [SMART_CONTRACT_INTERACTION_ACTION_KEY]: strings(
    'transactions.smart_contract_interaction',
  ),
  [SWAPS_TRANSACTION_ACTION_KEY]: strings('transactions.swaps_transaction'),
  [BRIDGE_TRANSACTION_ACTION_KEY]: strings('transactions.bridge_transaction'),
  [APPROVE_ACTION_KEY]: strings('transactions.approve'),
  [INCREASE_ALLOWANCE_ACTION_KEY]: strings('transactions.increase_allowance'),
  [SET_APPROVE_FOR_ALL_ACTION_KEY]: strings(
    'transactions.set_approval_for_all',
  ),
  [TransactionType.stakingClaim]: strings(
    'transactions.tx_review_staking_claim',
  ),
  [TransactionType.stakingDeposit]: strings(
    'transactions.tx_review_staking_deposit',
  ),
  [TransactionType.stakingUnstake]: strings(
    'transactions.tx_review_staking_unstake',
  ),
};

interface TransferDataOptions {
  toAddress?: string;
  amount?: string | number;
  fromAddress?: string;
  tokenId?: string;
}

/**
 * Generates transfer data for specified method
 *
 * @param type - Method to use to generate data
 * @param opts - Optional asset parameters
 * @returns String containing the generated transfer data
 */
export function generateTransferData(
  type: string | undefined = undefined,
  opts: TransferDataOptions = {},
): string | undefined {
  if (!type) {
    throw new TypeError('[transactions] type must be defined');
  }
  switch (type) {
    case 'transfer':
      if (!opts.toAddress || !opts.amount) {
        throw new Error(
          `[transactions] 'toAddress' and 'amount' must be defined for 'type' transfer`,
        );
      }
      return (
        TRANSFER_FUNCTION_SIGNATURE +
        Array.prototype.map
          .call(
            rawEncode(
              ['address', 'uint256'],
              [opts.toAddress, addHexPrefix(String(opts.amount))],
            ),
            (x: number) => ('00' + x.toString(16)).slice(-2),
          )
          .join('')
      );
    case 'transferFrom':
      return (
        TRANSFER_FROM_FUNCTION_SIGNATURE +
        Array.prototype.map
          .call(
            rawEncode(
              ['address', 'address', 'uint256'],
              [opts.fromAddress, opts.toAddress, addHexPrefix(String(opts.tokenId))],
            ),
            (x: number) => ('00' + x.toString(16)).slice(-2),
          )
          .join('')
      );
  }
  return undefined;
}

/**
 * Extracts the four-byte signature from Ethereum transaction data.
 * @param data The transaction data.
 * @returns The four-byte signature if data is provided, otherwise undefined.
 */
export function getFourByteSignature(data: string | undefined): string | undefined {
  return data?.substring(0, 10);
}

/**
 * Checks if the transaction data corresponds to an "approve" or "increase allowance" function call.
 * @param data The transaction data.
 * @returns True if the transaction is an "approve" or "increase allowance" call, false otherwise.
 */
export function isApprovalTransaction(data: string): boolean {
  const fourByteSignature = getFourByteSignature(data);
  return [
    APPROVE_FUNCTION_SIGNATURE,
    INCREASE_ALLOWANCE_SIGNATURE,
    SET_APPROVAL_FOR_ALL_SIGNATURE,
  ].includes(fourByteSignature as string);
}

interface ApprovalDataOptions {
  spender: string | null;
  value: string;
  data?: string;
}

/**
 * Generates ERC20 approval data
 *
 * @param opts - Object containing spender address, value and data
 * @returns String containing the generated data, by default for approve method
 */
export function generateApprovalData(opts: ApprovalDataOptions): string {
  const { spender, value, data } = opts;

  if (!spender || !value) {
    throw new Error(
      `[transactions] 'spender' and 'value' must be defined for 'type' approve or increaseAllowance`,
    );
  }

  const functionSignature =
    getFourByteSignature(data) ?? APPROVE_FUNCTION_SIGNATURE;

  return (
    functionSignature +
    Array.prototype.map
      .call(
        rawEncode(['address', 'uint256'], [spender, addHexPrefix(value)]),
        (x: number) => ('00' + x.toString(16)).slice(-2),
      )
      .join('')
  );
}

interface DecodeApproveDataResult {
  spenderAddress: string;
  encodedAmount: string;
}

export function decodeApproveData(data: string): DecodeApproveDataResult {
  return {
    spenderAddress: addHexPrefix(data.substr(34, 40)),
    encodedAmount: data.substr(74, 138),
  };
}

const BASE = 4 * 16;

/**
 * Decode transfer data for specified method data
 *
 * @param type - Method to use to generate data
 * @param data - Data to decode
 * @returns Object containing the decoded transfer data
 */
export function decodeTransferData(type: string, data: string): string[] | undefined {
  switch (type) {
    case 'transfer': {
      const encodedAddress = data.substring(10, BASE + 10);
      const encodedAmount = data.substring(74, BASE + 74);
      const bufferEncodedAddress = rawEncode(
        ['address'],
        [addHexPrefix(encodedAddress)],
      );
      return [
        addHexPrefix(rawDecode(['address'], bufferEncodedAddress)[0]),
        parseInt(encodedAmount, 16).toString(),
        encodedAmount,
      ];
    }
    case 'transferFrom': {
      const encodedFromAddress = data.substring(10, BASE + 10);
      const encodedToAddress = data.substring(74, BASE + 74);
      const encodedTokenId = data.substring(138, BASE + 138);
      const bufferEncodedFromAddress = rawEncode(
        ['address'],
        [addHexPrefix(encodedFromAddress)],
      );
      const bufferEncodedToAddress = rawEncode(
        ['address'],
        [addHexPrefix(encodedToAddress)],
      );
      return [
        addHexPrefix(rawDecode(['address'], bufferEncodedFromAddress)[0]),
        addHexPrefix(rawDecode(['address'], bufferEncodedToAddress)[0]),
        parseInt(encodedTokenId, 16).toString(),
      ];
    }
  }
}

interface MethodData {
  name?: string;
}

/**
 * Returns method data object for a transaction dat
 *
 * @param data - Transaction data
 * @param networkClientId - Network client ID
 * @returns Method data object containing the name if is valid
 */
export async function getMethodData(data: string, networkClientId?: string): Promise<MethodData> {
  if (data.length < 10) return {};
  const fourByteSignature = getFourByteSignature(data);
  if (fourByteSignature === TRANSFER_FUNCTION_SIGNATURE) {
    return { name: TOKEN_METHOD_TRANSFER };
  } else if (fourByteSignature === TRANSFER_FROM_FUNCTION_SIGNATURE) {
    return { name: TOKEN_METHOD_TRANSFER_FROM };
  } else if (fourByteSignature === APPROVE_FUNCTION_SIGNATURE) {
    return { name: TOKEN_METHOD_APPROVE };
  } else if (fourByteSignature === INCREASE_ALLOWANCE_SIGNATURE) {
    return { name: TOKEN_METHOD_INCREASE_ALLOWANCE };
  } else if (fourByteSignature === SET_APPROVAL_FOR_ALL_SIGNATURE) {
    return { name: TOKEN_METHOD_SET_APPROVAL_FOR_ALL };
  } else if (data.substr(0, 32) === CONTRACT_CREATION_SIGNATURE) {
    return { name: CONTRACT_METHOD_DEPLOY };
  }
  // If it's a new method, use on-chain method registry
  try {
    const registryObject = await handleMethodData(
      fourByteSignature ?? '',
      networkClientId ?? '',
    );
    if (registryObject) {
      return registryObject.parsedRegistryMethod;
    }
  } catch (e) {
    // Ignore and return empty object
  }
  return {};
}

/**
 * Returns wether the given address is a contract
 *
 * @param address - Ethereum address
 * @param chainId - Current chainId
 * @param networkClientId - ID of the network client
 * @returns Whether the given address is a contract
 */
export async function isSmartContractAddress(
  address: string,
  chainId: Hex,
  networkClientId: string | undefined = undefined,
): Promise<boolean> {
  if (!address) return false;

  address = toChecksumAddress(address);

  // If in contract map we don't need to cache it
  if (
    isMainnetByChainId(chainId) &&
    Engine.context.TokenListController.state.tokensChainsCache?.[chainId]
      ?.data?.[address]
  ) {
    return Promise.resolve(true);
  }

  const { NetworkController } = Engine.context;
  const finalNetworkClientId =
    networkClientId ?? NetworkController.findNetworkClientIdByChainId(chainId);
  const ethQuery = new EthQuery(
    NetworkController.getNetworkClientById(finalNetworkClientId).provider,
  );

  const code = address
    ? await query(ethQuery, 'getCode', [address])
    : undefined;

  return isSmartContractCode(code);
}

/**
 * Returns wether the given address is an ERC721 contract
 *
 * @param address - Ethereum address
 * @param tokenId - A possible collectible id
 * @returns Wether the given address is an ERC721 contract
 */
export async function isCollectibleAddress(address: string, tokenId: string): Promise<boolean> {
  const cache = CollectibleAddresses.cache[address];
  if (cache) {
    return Promise.resolve(cache);
  }
  const { AssetsContractController } = Engine.context;
  // Hack to know if the address is a collectible smart contract
  // for now this method is called from tx element so we have the respective 'tokenId'
  const ownerOf = await AssetsContractController.getERC721OwnerOf(
    address,
    tokenId,
  );
  const isCollectible = Boolean(ownerOf && ownerOf !== '0x');
  CollectibleAddresses.cache[address] = isCollectible;
  return isCollectible;
}

interface TransactionObject {
  networkClientId?: string;
  type?: string;
  txParams?: {
    data?: string;
    to?: string;
    from?: string;
    value?: string;
  };
  transaction?: {
    data?: string;
    to?: string;
    from?: string;
    value?: string;
  };
  toSmartContract?: boolean;
  isTransfer?: boolean;
  transferInformation?: {
    contractAddress?: string;
    symbol?: string;
  };
}

/**
 * Returns corresponding transaction action key
 *
 * @param transaction - Transaction object
 * @param chainId - Current chainId
 * @returns Corresponding transaction action key
 */
export async function getTransactionActionKey(transaction: TransactionObject, chainId: Hex): Promise<string> {
  const { networkClientId, type } = transaction ?? {};
  const txParams = transaction.txParams ?? transaction.transaction ?? {};
  const { data, to } = txParams;

  if (
    type &&
    [
      TransactionType.stakingClaim,
      TransactionType.stakingDeposit,
      TransactionType.stakingUnstake,
    ].includes(type as TransactionType)
  ) {
    return type;
  }

  if (!to) {
    return CONTRACT_METHOD_DEPLOY;
  }

  if (to === getSwapsContractAddress(chainId)) {
    return SWAPS_TRANSACTION_ACTION_KEY;
  }

  if (transaction.type === TransactionType.bridge) {
    return BRIDGE_TRANSACTION_ACTION_KEY;
  }

  // if data in transaction try to get method data
  if (data && data !== '0x') {
    const { name } = await getMethodData(data, networkClientId);
    if (name) return name;
  }

  const toSmartContract =
    transaction.toSmartContract !== undefined
      ? transaction.toSmartContract
      : await isSmartContractAddress(to, chainId, networkClientId);

  if (toSmartContract) {
    return SMART_CONTRACT_INTERACTION_ACTION_KEY;
  }

  return SEND_ETHER_ACTION_KEY;
}

/**
 * Returns corresponding transaction type message to show in UI
 *
 * @param tx - Transaction object
 * @param selectedAddress - Current account public address
 * @param ticker - Currency ticker
 * @param chainId - Current chainId
 * @returns Transaction type message
 */
export async function getActionKey(
  tx: TransactionObject,
  selectedAddress: string,
  ticker: string,
  chainId: Hex,
): Promise<string> {
  const actionKey = await getTransactionActionKey(tx, chainId);
  if (actionKey === SEND_ETHER_ACTION_KEY) {
    let currencySymbol: string | undefined = ticker;

    if (tx?.isTransfer && tx.transferInformation) {
      // Third party sending wrong token symbol
      if (
        tx.transferInformation.contractAddress === SAI_ADDRESS.toLowerCase()
      ) {
        tx.transferInformation.symbol = 'SAI';
      }
      currencySymbol = tx.transferInformation.symbol;
    }

    const txTo = tx.txParams?.to ?? '';
    const txFrom = tx.txParams?.from ?? '';
    const incoming = safeToChecksumAddress(txTo) === selectedAddress;
    const selfSent =
      incoming && safeToChecksumAddress(txFrom) === selectedAddress;
    return incoming
      ? selfSent
        ? currencySymbol
          ? strings('transactions.self_sent_unit', { unit: currencySymbol })
          : strings('transactions.self_sent_ether')
        : currencySymbol
        ? strings('transactions.received_unit', { unit: currencySymbol })
        : strings('transactions.received_ether')
      : currencySymbol
      ? strings('transactions.sent_unit', { unit: currencySymbol })
      : strings('transactions.sent_ether');
  }
  const transactionActionKey = actionKeys[actionKey];

  if (transactionActionKey) {
    return transactionActionKey;
  }

  return actionKey;
}

/**
 * Returns corresponding transaction function type
 *
 * @param transaction - Transaction object
 * @param chainId - Current chainId
 * @returns Transaction function type
 */
export async function getTransactionReviewActionKey(
  transaction: TransactionObject,
  chainId: Hex,
): Promise<string> {
  const actionKey = await getTransactionActionKey(transaction, chainId);
  const transactionReviewActionKey = reviewActionKeys[actionKey];
  if (transactionReviewActionKey) {
    return transactionReviewActionKey;
  }
  return actionKey;
}

/**
 * Returns corresponding ticker, defined or ETH
 *
 * @param ticker - Ticker
 * @returns Corresponding ticker or ETH
 */
export function getTicker(ticker: string | undefined): string {
  return ticker || strings('unit.eth');
}

interface EtherAsset {
  name: string;
  address: string;
  symbol: string;
  logo: string;
  isETH: boolean;
}

/**
 * Construct ETH asset object
 *
 * @param ticker - Ticker
 * @returns ETH object
 */
export function getEther(ticker: string | undefined): EtherAsset {
  return {
    name: 'Ether',
    address: '',
    symbol: ticker || strings('unit.eth'),
    logo: '../images/eth-logo-new.png',
    isETH: true,
  };
}

interface GetTransactionToNameConfig {
  addressBook: AddressBookControllerState['addressBook'];
  chainId: Hex;
  toAddress: string;
  internalAccounts: InternalAccount[];
  ensRecipient?: string;
}

/**
 * Select the correct tx recipient name from available data
 *
 * @param config - Configuration object
 * @returns recipient name
 */
export function getTransactionToName({
  addressBook,
  chainId,
  toAddress,
  internalAccounts,
  ensRecipient,
}: GetTransactionToNameConfig): string | undefined {
  if (ensRecipient) {
    return ensRecipient;
  }

  const networkAddressBook = addressBook[chainId] as Record<string, { name?: string }> | undefined;
  const checksummedToAddress = toChecksumAddress(toAddress);

  // Convert internalAccounts array to a map for quick lookup
  const internalAccountsMap = internalAccounts.reduce<Record<string, InternalAccount>>((acc, account) => {
    acc[toChecksumAddress(account.address)] = account;
    return acc;
  }, {});

  const matchingAccount = internalAccountsMap[checksummedToAddress];

  const transactionToName =
    (networkAddressBook &&
      networkAddressBook[checksummedToAddress] &&
      networkAddressBook[checksummedToAddress].name) ||
    (matchingAccount && matchingAccount.metadata.name);

  return transactionToName;
}

interface TransactionWithTime {
  time: number;
}

/**
 * Return a boolen if the transaction should be flagged to add the account added label
 *
 * @param transaction - Transaction object get time
 * @param addedAccountTime - Time the account was added to the wallet
 * @param accountAddedTimeInsertPointFound - Flag to see if the import time was already found
 */
export function addAccountTimeFlagFilter(
  transaction: TransactionWithTime,
  addedAccountTime: number,
  accountAddedTimeInsertPointFound: boolean,
): boolean {
  return (
    transaction.time <= addedAccountTime && !accountAddedTimeInsertPointFound
  );
}

interface TransactionState {
  transaction?: {
    transaction?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

//Leaving here a comment to re-visit this function since it's probably be possible to deprecate
export function getNormalizedTxState(state: TransactionState): Record<string, unknown> | undefined {
  return state.transaction
    ? { ...state.transaction, ...state.transaction.transaction }
    : undefined;
}

interface BrowserState {
  tabs?: Array<{ id: string; url?: string }>;
  activeTab?: string;
}

export const getActiveTabUrl = ({ browser = {} }: { browser?: BrowserState }): string | undefined =>
  browser.tabs &&
  browser.activeTab &&
  browser.tabs.find(({ id }) => id === browser.activeTab)?.url;

interface CalculateAmountsEIP1559Params {
  value: string;
  nativeCurrency: string;
  currentCurrency: string;
  conversionRate: number;
  gasFeeMinConversion: string;
  gasFeeMinNative: string;
  gasFeeMaxNative: string;
  gasFeeMaxConversion: string;
  gasFeeMaxHex: string;
  gasFeeMinHex: string;
}

export const calculateAmountsEIP1559 = ({
  value,
  nativeCurrency,
  currentCurrency,
  conversionRate,
  gasFeeMinConversion,
  gasFeeMinNative,
  gasFeeMaxNative,
  gasFeeMaxConversion,
  gasFeeMaxHex,
  gasFeeMinHex,
}: CalculateAmountsEIP1559Params) => {
  // amount numbers
  const amountConversion = getValueFromWeiHex({
    value,
    fromCurrency: nativeCurrency,
    toCurrency: currentCurrency,
    conversionRate,
    numberOfDecimals: 2,
  } as Parameters<typeof getValueFromWeiHex>[0]);
  const amountNative = getValueFromWeiHex({
    value,
    fromCurrency: nativeCurrency,
    toCurrency: nativeCurrency,
    conversionRate,
    numberOfDecimals: 6,
  } as Parameters<typeof getValueFromWeiHex>[0]);

  // Total numbers
  const totalMinNative = addEth(gasFeeMinNative, amountNative);
  const totalMinConversion = addFiat(gasFeeMinConversion, amountConversion);
  const totalMaxNative = addEth(gasFeeMaxNative, amountNative);
  const totalMaxConversion = addFiat(gasFeeMaxConversion, amountConversion);

  const totalMinHex = addCurrencies(gasFeeMinHex, value, {
    toNumericBase: 'hex',
    aBase: MULTIPLIER_HEX,
    bBase: MULTIPLIER_HEX,
  });

  const totalMaxHex = addCurrencies(gasFeeMaxHex, value, {
    toNumericBase: 'hex',
    aBase: MULTIPLIER_HEX,
    bBase: MULTIPLIER_HEX,
  });

  return {
    totalMinNative,
    totalMinConversion,
    totalMaxNative,
    totalMaxConversion,
    totalMinHex,
    totalMaxHex,
  };
};

interface CalculateEthEIP1559Params {
  nativeCurrency: string;
  currentCurrency: string;
  totalMinNative: string;
  totalMinConversion: string;
  totalMaxNative: string;
  totalMaxConversion: string;
}

export const calculateEthEIP1559 = ({
  nativeCurrency,
  currentCurrency,
  totalMinNative,
  totalMinConversion,
  totalMaxNative,
  totalMaxConversion,
}: CalculateEthEIP1559Params) => {
  const renderableTotalMinNative = formatETHFee(totalMinNative, nativeCurrency);
  const renderableTotalMinConversion = formatCurrency(
    totalMinConversion,
    currentCurrency,
  );

  const renderableTotalMaxNative = formatETHFee(totalMaxNative, nativeCurrency);
  const renderableTotalMaxConversion = formatCurrency(
    totalMaxConversion,
    currentCurrency,
  );
  return [
    renderableTotalMinNative,
    renderableTotalMinConversion,
    renderableTotalMaxNative,
    renderableTotalMaxConversion,
  ];
};

interface CalculateERC20EIP1559Params {
  currentCurrency: string;
  nativeCurrency: string;
  conversionRate: number;
  exchangeRate?: number;
  tokenAmount: string;
  totalMinConversion: string;
  totalMaxConversion: string;
  symbol: string;
  totalMinNative: string;
  totalMaxNative: string;
}

export const calculateERC20EIP1559 = ({
  currentCurrency,
  nativeCurrency,
  conversionRate,
  exchangeRate,
  tokenAmount,
  totalMinConversion,
  totalMaxConversion,
  symbol,
  totalMinNative,
  totalMaxNative,
}: CalculateERC20EIP1559Params) => {
  const tokenAmountConversion = convertTokenToFiat({
    value: tokenAmount,
    toCurrency: currentCurrency,
    conversionRate,
    contractExchangeRate: exchangeRate,
  });

  const tokenTotalMinConversion = roundExponential(
    addFiat(tokenAmountConversion, totalMinConversion),
  );
  const tokenTotalMaxConversion = roundExponential(
    addFiat(tokenAmountConversion, totalMaxConversion),
  );

  const renderableTotalMinConversion = formatCurrency(
    tokenTotalMinConversion,
    currentCurrency,
  );
  const renderableTotalMaxConversion = formatCurrency(
    tokenTotalMaxConversion,
    currentCurrency,
  );

  const renderableTotalMinNative = `${formatETHFee(
    tokenAmount,
    symbol,
  )} + ${formatETHFee(totalMinNative, nativeCurrency)}`;
  const renderableTotalMaxNative = `${formatETHFee(
    tokenAmount,
    symbol,
  )} + ${formatETHFee(totalMaxNative, nativeCurrency)}`;
  return [
    renderableTotalMinNative,
    renderableTotalMinConversion,
    renderableTotalMaxNative,
    renderableTotalMaxConversion,
  ];
};

interface GasFeeEstimate {
  maxWaitTimeEstimate?: number;
  minWaitTimeEstimate?: number;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedMaxFeePerGas?: string;
}

interface CalculateEIP1559TimesParams {
  suggestedMaxPriorityFeePerGas: string;
  suggestedMaxFeePerGas: string;
  selectedOption?: string;
  recommended?: string;
  gasFeeEstimates?: Record<string, GasFeeEstimate>;
}

export const calculateEIP1559Times = ({
  suggestedMaxPriorityFeePerGas,
  suggestedMaxFeePerGas,
  selectedOption,
  recommended,
  gasFeeEstimates,
}: CalculateEIP1559TimesParams) => {
  let timeEstimate = strings('times_eip1559.unknown');
  let timeEstimateColor = 'grey';
  let timeEstimateId;

  const LOW = AppConstants.GAS_OPTIONS.LOW;
  const MEDIUM = AppConstants.GAS_OPTIONS.MEDIUM;
  const HIGH = AppConstants.GAS_OPTIONS.HIGH;

  if (!recommended) recommended = MEDIUM;

  if (!selectedOption) {
    timeEstimateColor = 'grey';
  } else if (recommended === HIGH) {
    if (selectedOption === HIGH) timeEstimateColor = 'green';
    else timeEstimateColor = 'red';
  } else if (selectedOption === LOW) {
    timeEstimateColor = 'red';
  } else {
    timeEstimateColor = 'green';
  }

  try {
    const language = I18n.locale.substr(0, 2);

    const timeParams = {
      language,
      fallbacks: ['en'],
    };

    if (
      selectedOption &&
      gasFeeEstimates &&
      gasFeeEstimates[LOW] &&
      gasFeeEstimates[MEDIUM] &&
      gasFeeEstimates[HIGH]
    ) {
      let hasTime = false;
      if (selectedOption === LOW && gasFeeEstimates[LOW].maxWaitTimeEstimate) {
        timeEstimate = `${strings('times_eip1559.maybe')} ${humanizeDuration(
          gasFeeEstimates[LOW].maxWaitTimeEstimate,
          timeParams,
        )}`;
        timeEstimateId = AppConstants.GAS_TIMES.MAYBE;
        hasTime = true;
      } else if (
        selectedOption === MEDIUM &&
        gasFeeEstimates[LOW].maxWaitTimeEstimate
      ) {
        timeEstimate = `${strings('times_eip1559.likely')} ${humanizeDuration(
          gasFeeEstimates[LOW].maxWaitTimeEstimate,
          timeParams,
        )}`;
        timeEstimateId = AppConstants.GAS_TIMES.LIKELY;
        hasTime = true;
      } else if (
        selectedOption === HIGH &&
        gasFeeEstimates[HIGH].minWaitTimeEstimate
      ) {
        timeEstimate = `${strings(
          'times_eip1559.likely_in',
        )} ${humanizeDuration(
          gasFeeEstimates[HIGH].minWaitTimeEstimate,
          timeParams,
        )}`;
        timeEstimateId = AppConstants.GAS_TIMES.VERY_LIKELY;
        hasTime = true;
      }

      if (
        Number(suggestedMaxPriorityFeePerGas) >=
        Number(gasFeeEstimates[HIGH].suggestedMaxPriorityFeePerGas)
      ) {
        timeEstimate = `${strings(
          'times_eip1559.likely_in',
        )} ${humanizeDuration(
          gasFeeEstimates[HIGH].minWaitTimeEstimate,
          timeParams,
        )}`;
        timeEstimateColor = 'orange';
        timeEstimateId = AppConstants.GAS_TIMES.VERY_LIKELY;
      }

      if (hasTime) {
        return { timeEstimate, timeEstimateColor, timeEstimateId };
      }
    }

    const { GasFeeController } = Engine.context;
    const times = GasFeeController.getTimeEstimate(
      suggestedMaxPriorityFeePerGas,
      suggestedMaxFeePerGas,
    );

    if (
      !times ||
      (times as unknown) === 'unknown' ||
      (typeof times === 'object' && Object.keys(times).length < 2) ||
      (typeof times === 'object' && 'upperTimeBound' in times && times.upperTimeBound === 'unknown')
    ) {
      timeEstimate = strings('times_eip1559.unknown');
      timeEstimateId = AppConstants.GAS_TIMES.UNKNOWN;
      timeEstimateColor = 'red';
    } else if (selectedOption === LOW) {
      timeEstimate = `${strings('times_eip1559.maybe')} ${humanizeDuration(
        times.upperTimeBound,
        timeParams,
      )}`;
      timeEstimateId = AppConstants.GAS_TIMES.MAYBE;
    } else if (selectedOption === MEDIUM) {
      timeEstimate = `${strings('times_eip1559.likely')} ${humanizeDuration(
        times.upperTimeBound,
        timeParams,
      )}`;
      timeEstimateId = AppConstants.GAS_TIMES.LIKELY;
    } else if (selectedOption === HIGH) {
      timeEstimate = `${strings(
        'times_eip1559.very_likely',
      )} ${humanizeDuration(times.upperTimeBound, timeParams)}`;
      timeEstimateId = AppConstants.GAS_TIMES.VERY_LIKELY;
    } else if (times.upperTimeBound === 0) {
      timeEstimate = `${strings('times_eip1559.at_least')} ${humanizeDuration(
        times.lowerTimeBound,
        timeParams,
      )}`;
      timeEstimateColor = 'red';
      timeEstimateId = AppConstants.GAS_TIMES.AT_LEAST;
    } else if (times.lowerTimeBound === 0) {
      timeEstimate = `${strings('times_eip1559.less_than')} ${humanizeDuration(
        times.upperTimeBound,
        timeParams,
      )}`;
      timeEstimateColor = 'green';
      timeEstimateId = AppConstants.GAS_TIMES.LESS_THAN;
    } else {
      timeEstimate = `${humanizeDuration(
        times.lowerTimeBound,
        timeParams,
      )} - ${humanizeDuration(times.upperTimeBound, timeParams)}`;
      timeEstimateId = AppConstants.GAS_TIMES.RANGE;
    }
  } catch (error) {
    Logger.log('ERROR ESTIMATING TIME', error);
  }
  if (!timeEstimateId) {
    timeEstimate = AppConstants.GAS_TIMES.UNKNOWN;
  }

  return { timeEstimate, timeEstimateColor, timeEstimateId };
};

interface CalculateEIP1559GasFeeHexesParams {
  gasLimitHex: string;
  estimatedGasLimitHex?: string;
  estimatedBaseFeeHex: string;
  suggestedMaxFeePerGasHex: string;
  suggestedMaxPriorityFeePerGasHex: string;
}

export const calculateEIP1559GasFeeHexes = ({
  gasLimitHex,
  estimatedGasLimitHex,
  estimatedBaseFeeHex,
  suggestedMaxFeePerGasHex,
  suggestedMaxPriorityFeePerGasHex,
}: CalculateEIP1559GasFeeHexesParams) => {
  // Hex calculations
  const estimatedBaseFee_PLUS_suggestedMaxPriorityFeePerGasHex = addCurrencies(
    estimatedBaseFeeHex,
    suggestedMaxPriorityFeePerGasHex,
    {
      toNumericBase: 'hex',
      aBase: MULTIPLIER_HEX,
      bBase: MULTIPLIER_HEX,
    },
  );

  const maxPriorityFeePerGasTimesGasLimitHex = multiplyCurrencies(
    suggestedMaxPriorityFeePerGasHex,
    gasLimitHex,
    {
      toNumericBase: 'hex',
      multiplicandBase: MULTIPLIER_HEX,
      multiplierBase: MULTIPLIER_HEX,
    },
  );

  const gasFeeMinHex = multiplyCurrencies(
    estimatedBaseFee_PLUS_suggestedMaxPriorityFeePerGasHex,
    estimatedGasLimitHex || gasLimitHex,
    {
      toNumericBase: 'hex',
      multiplicandBase: MULTIPLIER_HEX,
      multiplierBase: MULTIPLIER_HEX,
    },
  );
  const gasFeeMaxHex = multiplyCurrencies(
    suggestedMaxFeePerGasHex,
    gasLimitHex,
    {
      toNumericBase: 'hex',
      multiplicandBase: MULTIPLIER_HEX,
      multiplierBase: MULTIPLIER_HEX,
    },
  );

  return {
    estimatedBaseFee_PLUS_suggestedMaxPriorityFeePerGasHex,
    maxPriorityFeePerGasTimesGasLimitHex,
    gasFeeMinHex,
    gasFeeMaxHex,
  };
};

interface SelectedAsset {
  isETH?: boolean;
  tokenId?: string;
  address?: string;
  symbol?: string;
  decimals?: number;
}

interface ParseTransactionEIP1559Params {
  selectedGasFee: {
    suggestedMaxPriorityFeePerGas: string | number;
    suggestedMaxFeePerGas: string | number;
    estimatedBaseFee?: string;
    suggestedGasLimit: string | number;
    suggestedEstimatedGasLimit?: string | number;
    selectedOption?: string;
    recommended?: string;
  };
  swapsParams?: {
    sourceAmount?: string;
    tradeValue?: string;
    isNativeAsset?: boolean;
  };
  contractExchangeRates: Record<string, number>;
  conversionRate: number;
  currentCurrency: string;
  nativeCurrency: string;
  transactionState?: {
    selectedAsset: SelectedAsset;
    transaction: {
      value?: string;
      data?: string;
    };
  };
  gasFeeEstimates?: Record<string, GasFeeEstimate>;
}

interface ParseTransactionEIP1559Options {
  onlyGas?: boolean;
}

export const parseTransactionEIP1559 = (
  {
    selectedGasFee,
    swapsParams,
    contractExchangeRates,
    conversionRate,
    currentCurrency,
    nativeCurrency,
    transactionState: { selectedAsset, transaction: { value, data } } = {
      selectedAsset: {},
      transaction: {},
    },
    gasFeeEstimates,
  }: ParseTransactionEIP1559Params,
  { onlyGas }: ParseTransactionEIP1559Options = {},
) => {
  value = value || '0x0';

  const suggestedMaxPriorityFeePerGas = String(
    selectedGasFee.suggestedMaxPriorityFeePerGas,
  );
  const suggestedMaxFeePerGas = String(selectedGasFee.suggestedMaxFeePerGas);
  const estimatedBaseFee = selectedGasFee.estimatedBaseFee || '0';

  // Convert to hex
  const estimatedBaseFeeHex = decGWEIToHexWEI(estimatedBaseFee);
  const suggestedMaxPriorityFeePerGasHex = decGWEIToHexWEI(
    suggestedMaxPriorityFeePerGas,
  );
  const suggestedMaxFeePerGasHex = decGWEIToHexWEI(suggestedMaxFeePerGas);
  const gasLimitHex = BNToHex(new BN(selectedGasFee.suggestedGasLimit));
  const estimatedGasLimitHex =
    selectedGasFee.suggestedEstimatedGasLimit &&
    BNToHex(new BN(selectedGasFee.suggestedEstimatedGasLimit));

  const { timeEstimate, timeEstimateColor, timeEstimateId } =
    calculateEIP1559Times({
      suggestedMaxPriorityFeePerGas,
      suggestedMaxFeePerGas,
      selectedOption: selectedGasFee.selectedOption,
      recommended: selectedGasFee.recommended,
      gasFeeEstimates,
    });

  // eslint-disable-next-line prefer-const
  let { gasFeeMinHex, gasFeeMaxHex, maxPriorityFeePerGasTimesGasLimitHex } =
    calculateEIP1559GasFeeHexes({
      gasLimitHex,
      estimatedGasLimitHex: estimatedGasLimitHex || undefined,
      estimatedBaseFeeHex: String(estimatedBaseFeeHex),
      suggestedMaxPriorityFeePerGasHex: String(suggestedMaxPriorityFeePerGasHex),
      suggestedMaxFeePerGasHex: String(suggestedMaxFeePerGasHex),
    });

  if (swapsParams) {
    const { tradeValue, isNativeAsset, sourceAmount } = swapsParams;
    gasFeeMinHex = addCurrencies(gasFeeMinHex, tradeValue, {
      toNumericBase: 'hex',
      aBase: MULTIPLIER_HEX,
      bBase: MULTIPLIER_HEX,
    });
    gasFeeMaxHex = addCurrencies(gasFeeMaxHex, tradeValue, {
      toNumericBase: 'hex',
      aBase: MULTIPLIER_HEX,
      bBase: MULTIPLIER_HEX,
    });

    if (isNativeAsset) {
      gasFeeMinHex = subtractCurrencies(gasFeeMinHex, sourceAmount, {
        toNumericBase: 'hex',
        aBase: MULTIPLIER_HEX,
        bBase: 10,
      });
      gasFeeMaxHex = subtractCurrencies(gasFeeMaxHex, sourceAmount, {
        toNumericBase: 'hex',
        aBase: MULTIPLIER_HEX,
        bBase: 10,
      });
    }
  }

  const maxPriorityFeeNative = getTransactionFee({
    value: maxPriorityFeePerGasTimesGasLimitHex,
    fromCurrency: nativeCurrency,
    toCurrency: nativeCurrency,
    numberOfDecimals: 6,
    conversionRate,
  });
  const maxPriorityFeeConversion = getTransactionFee({
    value: maxPriorityFeePerGasTimesGasLimitHex,
    fromCurrency: nativeCurrency,
    toCurrency: currentCurrency,
    numberOfDecimals: 2,
    conversionRate,
  });

  const renderableMaxPriorityFeeNative = formatETHFee(
    maxPriorityFeeNative,
    nativeCurrency,
    Boolean(maxPriorityFeePerGasTimesGasLimitHex) &&
      maxPriorityFeePerGasTimesGasLimitHex !== '0x0',
  );
  const renderableMaxPriorityFeeConversion = formatCurrency(
    maxPriorityFeeConversion,
    currentCurrency,
  );

  const maxFeePerGasNative = getTransactionFee({
    value: gasFeeMaxHex,
    fromCurrency: nativeCurrency,
    toCurrency: nativeCurrency,
    numberOfDecimals: 6,
    conversionRate,
  });
  const maxFeePerGasConversion = getTransactionFee({
    value: gasFeeMaxHex,
    fromCurrency: nativeCurrency,
    toCurrency: currentCurrency,
    numberOfDecimals: 2,
    conversionRate,
  });
  const renderableMaxFeePerGasNative = formatETHFee(
    maxFeePerGasNative,
    nativeCurrency,
    Boolean(gasFeeMaxHex) && gasFeeMaxHex !== '0x0',
  );
  const renderableMaxFeePerGasConversion = formatCurrency(
    maxFeePerGasConversion,
    currentCurrency,
  );

  // Gas fee min numbers
  const gasFeeMinNative = getTransactionFee({
    value: gasFeeMinHex,
    fromCurrency: nativeCurrency,
    toCurrency: nativeCurrency,
    numberOfDecimals: 6,
    conversionRate,
  });
  const gasFeeMinConversion = getTransactionFee({
    value: gasFeeMinHex,
    fromCurrency: nativeCurrency,
    toCurrency: currentCurrency,
    numberOfDecimals: 2,
    conversionRate,
  });

  // Gas fee max numbers
  const gasFeeMaxNative = getTransactionFee({
    value: gasFeeMaxHex,
    fromCurrency: nativeCurrency,
    toCurrency: nativeCurrency,
    numberOfDecimals: 6,
    conversionRate,
  });
  const gasFeeMaxConversion = getTransactionFee({
    value: gasFeeMaxHex,
    fromCurrency: nativeCurrency,
    toCurrency: currentCurrency,
    numberOfDecimals: 2,
    conversionRate,
  });

  const renderableGasFeeMinNative = formatETHFee(
    gasFeeMinNative,
    nativeCurrency,
    Boolean(gasFeeMinHex) && gasFeeMinHex !== '0x0',
  );
  const renderableGasFeeMinConversion = formatCurrency(
    gasFeeMinConversion,
    currentCurrency,
  );
  const renderableGasFeeMaxNative = formatETHFee(
    gasFeeMaxNative,
    nativeCurrency,
    Boolean(gasFeeMaxHex) && gasFeeMaxHex !== '0x0',
  );
  const renderableGasFeeMaxConversion = formatCurrency(
    gasFeeMaxConversion,
    currentCurrency,
  );

  // This is the total transaction value for comparing with account balance
  const valuePlusGasMaxHex = addCurrencies(gasFeeMaxHex, value, {
    toNumericBase: 'hex',
    aBase: MULTIPLIER_HEX,
    bBase: MULTIPLIER_HEX,
  });

  if (onlyGas) {
    return {
      gasFeeMinNative,
      renderableGasFeeMinNative,
      gasFeeMinConversion,
      renderableGasFeeMinConversion,
      gasFeeMaxNative,
      gasFeeMaxHex,
      renderableGasFeeMaxNative,
      gasFeeMaxConversion,
      renderableGasFeeMaxConversion,
      maxPriorityFeeNative,
      renderableMaxPriorityFeeNative,
      maxPriorityFeeConversion,
      renderableMaxPriorityFeeConversion,
      renderableMaxFeePerGasNative,
      renderableMaxFeePerGasConversion,
      timeEstimate,
      timeEstimateColor,
      timeEstimateId,
      estimatedBaseFee,
      estimatedBaseFeeHex,
      suggestedMaxPriorityFeePerGas,
      suggestedMaxPriorityFeePerGasHex,
      suggestedMaxFeePerGas,
      suggestedMaxFeePerGasHex,
      gasLimitHex,
      suggestedGasLimit: selectedGasFee.suggestedGasLimit,
      suggestedEstimatedGasLimit: selectedGasFee.suggestedEstimatedGasLimit,
      totalMaxHex: valuePlusGasMaxHex,
    };
  }

  const {
    totalMinNative,
    totalMinConversion,
    totalMaxNative,
    totalMaxConversion,
    totalMinHex,
    totalMaxHex,
  } = calculateAmountsEIP1559({
    value: value as string,
    nativeCurrency,
    currentCurrency,
    conversionRate,
    gasFeeMinConversion: String(gasFeeMinConversion),
    gasFeeMinNative: String(gasFeeMinNative),
    gasFeeMaxNative: String(gasFeeMaxNative),
    gasFeeMaxConversion: String(gasFeeMaxConversion),
    gasFeeMaxHex: String(gasFeeMaxHex),
    gasFeeMinHex: String(gasFeeMinHex),
  });

  let renderableTotalMinNative,
    renderableTotalMinConversion,
    renderableTotalMaxNative,
    renderableTotalMaxConversion;

  if (selectedAsset.isETH || selectedAsset.tokenId) {
    [
      renderableTotalMinNative,
      renderableTotalMinConversion,
      renderableTotalMaxNative,
      renderableTotalMaxConversion,
    ] = calculateEthEIP1559({
      nativeCurrency,
      currentCurrency,
      totalMinNative,
      totalMinConversion,
      totalMaxNative,
      totalMaxConversion,
    });
  } else {
    const { address = '', symbol = 'ERC20', decimals = 18 } = selectedAsset;

    const transferData = decodeTransferData('transfer', data ?? '');
    const rawAmount = transferData?.[2] ?? '0';
    const rawAmountString = parseInt(rawAmount, 16).toLocaleString('fullwide', {
      useGrouping: false,
    });
    const tokenAmount = renderFromTokenMinimalUnit(rawAmountString, decimals);

    const exchangeRate = address ? contractExchangeRates[address] : undefined;

    [
      renderableTotalMinNative,
      renderableTotalMinConversion,
      renderableTotalMaxNative,
      renderableTotalMaxConversion,
    ] = calculateERC20EIP1559({
      currentCurrency,
      nativeCurrency,
      conversionRate,
      exchangeRate,
      tokenAmount,
      totalMinConversion,
      totalMaxConversion,
      symbol,
      totalMinNative,
      totalMaxNative,
    });
  }

  return {
    gasFeeMinNative,
    renderableGasFeeMinNative,
    gasFeeMinConversion,
    renderableGasFeeMinConversion,
    gasFeeMaxNative,
    gasFeeMaxHex,
    renderableGasFeeMaxNative,
    gasFeeMaxConversion,
    renderableGasFeeMaxConversion,
    maxPriorityFeeNative,
    renderableMaxPriorityFeeNative,
    maxPriorityFeeConversion,
    renderableMaxPriorityFeeConversion,
    renderableMaxFeePerGasNative,
    renderableMaxFeePerGasConversion,
    timeEstimate,
    timeEstimateColor,
    timeEstimateId,
    totalMinNative,
    renderableTotalMinNative,
    totalMinConversion,
    renderableTotalMinConversion,
    totalMaxNative,
    renderableTotalMaxNative,
    totalMaxConversion,
    renderableTotalMaxConversion,
    estimatedBaseFee,
    estimatedBaseFeeHex,
    suggestedMaxPriorityFeePerGas,
    suggestedMaxPriorityFeePerGasHex,
    suggestedMaxFeePerGas,
    suggestedMaxFeePerGasHex,
    gasLimitHex,
    suggestedGasLimit: selectedGasFee.suggestedGasLimit,
    totalMinHex,
    totalMaxHex,
  };
};

interface ParseTransactionLegacyParams {
  contractExchangeRates: Record<string, { price?: number }>;
  conversionRate: number;
  currentCurrency: string;
  transactionState?: {
    selectedAsset: SelectedAsset;
    transaction: {
      value?: string;
      data?: string;
    };
  };
  ticker: string;
  selectedGasFee: {
    suggestedGasLimit: string | number;
    suggestedGasPrice: string;
  };
  multiLayerL1FeeTotal?: string;
}

export const parseTransactionLegacy = (
  {
    contractExchangeRates,
    conversionRate,
    currentCurrency,
    transactionState: { selectedAsset, transaction: { value, data } } = {
      selectedAsset: {},
      transaction: {},
    },
    ticker,
    selectedGasFee,
    multiLayerL1FeeTotal,
  }: ParseTransactionLegacyParams,
  { onlyGas }: ParseTransactionEIP1559Options = {},
) => {
  const gasLimit = new BN(selectedGasFee.suggestedGasLimit);
  const gasLimitHex = BNToHex(new BN(selectedGasFee.suggestedGasLimit));

  let weiTransactionFee =
    gasLimit &&
    gasLimit.mul(hexToBN(decGWEIToHexWEI(selectedGasFee.suggestedGasPrice)));
  if (multiLayerL1FeeTotal) {
    weiTransactionFee = hexToBN(
      sumHexWEIs([BNToHex(weiTransactionFee), multiLayerL1FeeTotal]),
    );
  }

  const suggestedGasPriceHex = decGWEIToHexWEI(
    selectedGasFee.suggestedGasPrice,
  );

  const valueBN = value ? hexToBN(value) : hexToBN('0x0');
  const transactionFeeFiat = weiToFiat(
    weiTransactionFee,
    conversionRate,
    currentCurrency,
  );
  const parsedTicker = getTicker(ticker);
  const transactionFee = `${renderFromWei(weiTransactionFee)} ${parsedTicker}`;

  const totalHex = valueBN.add(weiTransactionFee);

  if (onlyGas) {
    return {
      transactionFeeFiat,
      transactionFee,
      suggestedGasPrice: selectedGasFee.suggestedGasPrice,
      suggestedGasPriceHex,
      suggestedGasLimit: selectedGasFee.suggestedGasLimit,
      suggestedGasLimitHex: gasLimitHex,
      totalHex,
    };
  }

  let transactionTotalAmount, transactionTotalAmountFiat;

  if (selectedAsset.isETH) {
    const transactionTotalAmountBN =
      weiTransactionFee && weiTransactionFee.add(valueBN);
    transactionTotalAmount = `${renderFromWei(
      transactionTotalAmountBN,
    )} ${parsedTicker}`;
    transactionTotalAmountFiat = weiToFiat(
      transactionTotalAmountBN,
      conversionRate,
      currentCurrency,
    );
  } else if (selectedAsset.tokenId) {
    const transactionTotalAmountBN =
      weiTransactionFee && weiTransactionFee.add(valueBN);
    transactionTotalAmount = `${renderFromWei(
      weiTransactionFee,
    )} ${parsedTicker}`;

    transactionTotalAmountFiat = weiToFiat(
      transactionTotalAmountBN,
      conversionRate,
      currentCurrency,
    );
  } else if (data) {
    const { address = '', symbol = 'ERC20', decimals = 18 } = selectedAsset;
    const transferData = decodeTransferData('transfer', data);
    const rawAmount = transferData?.[2] ?? '0';
    const rawAmountString = parseInt(rawAmount, 16).toLocaleString('fullwide', {
      useGrouping: false,
    });
    const transferValue = renderFromTokenMinimalUnit(rawAmountString, decimals);
    const transactionValue = `${transferValue} ${symbol}`;
    const exchangeRateObj = address ? contractExchangeRates?.[address] : undefined;
    const exchangeRate = typeof exchangeRateObj === 'number' ? exchangeRateObj : exchangeRateObj?.price;
    const transactionFeeFiatNumber = weiToFiatNumber(
      weiTransactionFee,
      conversionRate,
    );

    const transactionValueFiatNumber = balanceToFiatNumber(
      transferValue,
      conversionRate,
      exchangeRate ?? 0,
    );
    transactionTotalAmount = `${transactionValue} + ${renderFromWei(
      weiTransactionFee,
    )} ${parsedTicker}`;
    transactionTotalAmountFiat = renderFiatAddition(
      transactionValueFiatNumber,
      transactionFeeFiatNumber,
      currentCurrency,
    );
  }

  return {
    transactionFeeFiat,
    transactionFee,
    transactionTotalAmount,
    transactionTotalAmountFiat,
    suggestedGasPrice: selectedGasFee.suggestedGasPrice,
    suggestedGasPriceHex,
    suggestedGasLimit: selectedGasFee.suggestedGasLimit,
    suggestedGasLimitHex: gasLimitHex,
    totalHex,
  };
};

/**
 * Validate transaction value for speed up or cancel transaction actions
 *
 * @param {object} transaction - Transaction object to validate
 * @param {string} rate - Rate to validate
 * @param {string} accounts - Map of accounts to information objects including balances
 * @returns {string} - Whether the balance is validated or not
 */
interface TransactionWithTxParams {
  transaction: {
    from?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    gas?: string;
    value?: string;
  };
}

interface AccountsMap {
  [address: string]: {
    balance: string;
  };
}

export function validateTransactionActionBalance(
  transaction: TransactionWithTxParams,
  rate: number,
  accounts: AccountsMap,
): boolean {
  try {
    const checksummedFrom = safeToChecksumAddress(transaction.transaction.from ?? '');
    if (!checksummedFrom) return false;
    const balance = accounts[checksummedFrom]?.balance;
    if (!balance) return false;

    let gasPrice = transaction.transaction.gasPrice;
    const transactionToCheck = transaction.transaction;

    if (isEIP1559Transaction(transactionToCheck as Parameters<typeof isEIP1559Transaction>[0])) {
      gasPrice = transactionToCheck.maxFeePerGas;
    }

    return hexToBN(balance).lt(
      hexToBN(gasPrice)
        .mul(new BN(rate * 10))
        .div(new BN(10))
        .mul(hexToBN(transaction.transaction.gas))
        .add(hexToBN(transaction.transaction.value)),
    );
  } catch (e) {
    return false;
  }
}

/**
 * @param {number|string|BigNumber} value
 * @param {number=} decimals
 * @returns {BigNumber}
 */
export function calcTokenAmount(
  value: number | string | BigNumber,
  decimals?: number,
): BigNumber {
  const divisor = new BigNumber(10).pow(decimals ?? 0);
  return new BigNumber(String(value)).div(divisor);
}

export function calcTokenValue(
  value: number | string | BigNumber,
  decimals?: number | string,
): BigNumber {
  const multiplier = Math.pow(10, Number(decimals || 0));
  return new BigNumber(String(value)).times(multiplier);
}

/**
 * Attempts to get the address parameter of the given token transaction data
 * (i.e. function call) per the Human Standard Token ABI, in the following
 * order:
 *   - The '_to' parameter, if present
 *   - The first parameter, if present
 *
 * @param {Object} tokenData - ethers Interface token data.
 * @returns {string | undefined} A lowercase address string.
 */
interface TokenData {
  args?: {
    _to?: { toString(): string };
    _value?: { _hex?: string; toString(): string };
    [index: number]: { _hex?: string; toString(): string };
  };
}

export function getTokenAddressParam(tokenData: TokenData = {}): string | undefined {
  const value = tokenData?.args?._to || tokenData?.args?.[0];
  return value?.toString().toLowerCase();
}

/**
 * Gets the '_hex' parameter of the given token transaction data
 * (i.e function call) per the Human Standard Token ABI, if present.
 *
 * @param {Object} tokenData - ethers Interface token data.
 * @returns {string | undefined} A hex string value.
 */
export function getTokenValueParamAsHex(tokenData: TokenData = {}): string | undefined {
  const value = tokenData?.args?._value?._hex || tokenData?.args?.[1]?._hex;
  return value?.toLowerCase();
}

/**
 * Gets the '_value' parameter of the given token transaction data
 * (i.e function call) per the Human Standard Token ABI, if present.
 *
 * @param {Object} tokenData - ethers Interface token data.
 * @returns {string | undefined} A decimal string value.
 */
export function getTokenValueParam(tokenData: TokenData = {}): string | undefined {
  return tokenData?.args?._value?.toString();
}

interface TokenParam {
  name: string;
  value: string;
}

export function getTokenValue(tokenParams: TokenParam[] = []): string | undefined {
  const valueData = tokenParams.find((param) => param.name === '_value');
  return valueData && valueData.value;
}

/**
 * Generates a new transaction with the token allowance
 * @param {String | Object} tokenValue - value for the token allowance
 * @param {Number} tokenDecimals - Token decimal
 * @param {String} spenderAddress - Address to which the allowance will be granted
 * @param {Object} transaction - Transaction to update
 * @returns A new transaction object with the token allowance encoded
 */
interface TransactionWithData {
  data?: string;
  [key: string]: unknown;
}

export const generateTxWithNewTokenAllowance = (
  tokenValue: string | number,
  tokenDecimals: number,
  spenderAddress: string,
  transaction: TransactionWithData,
): TransactionWithData => {
  const uint = toTokenMinimalUnit(tokenValue, tokenDecimals);
  const approvalData = generateApprovalData({
    spender: spenderAddress,
    value: uint.gt(UINT256_BN_MAX_VALUE)
      ? UINT256_BN_MAX_VALUE.toString(16)
      : uint.toString(16),
    data: transaction?.data,
  });
  const newApprovalTransaction = {
    ...transaction,
    data: approvalData,
  };
  return newApprovalTransaction;
};

/**
 * Returns the minimum valid token allowance
 * @param {Number} tokenDecimals - Token decimal
 * @returns String indicating the minimum token allowance
 */
export const minimumTokenAllowance = (tokenDecimals: number): string => {
  if (tokenDecimals < 0) {
    throw new Error(NEGATIVE_TOKEN_DECIMALS);
  }
  return Math.pow(10, -1 * tokenDecimals)
    .toFixed(tokenDecimals)
    .toString();
};

/**
 * For a MM Swap tx: Determines if the transaction is an ERC20 approve tx OR the actual swap tx where tokens are transferred
 */
export const getIsSwapApproveOrSwapTransaction = (
  data: string | undefined,
  origin: string | undefined,
  to: string | undefined,
  chainId: Hex,
): boolean => {
  if (!data) {
    return false;
  }

  // if approval data includes metaswap contract
  // if destination address is metaswap contract
  return Boolean(
    origin === process.env.MM_FOX_CODE &&
    to &&
    (swapsUtils.isValidContractAddress(chainId, to) ||
      (data?.startsWith(APPROVE_FUNCTION_SIGNATURE) &&
        decodeApproveData(data).spenderAddress?.toLowerCase() ===
          swapsUtils.getSwapsContractAddress(chainId)))
  );
};

/**
 * For a MM Swap tx: Determines if the transaction is an ERC20 approve tx
 */
export const getIsSwapApproveTransaction = (
  data: string | undefined,
  origin: string | undefined,
  to: string | undefined,
  chainId: Hex,
): boolean => {
  if (!data) {
    return false;
  }

  const isFromSwaps = origin === process.env.MM_FOX_CODE;
  const isApproveFunction =
    data && getFourByteSignature(data) === APPROVE_FUNCTION_SIGNATURE;
  const isSpenderSwapsContract =
    decodeApproveData(data).spenderAddress?.toLowerCase() ===
    swapsUtils.getSwapsContractAddress(chainId);

  return Boolean(isFromSwaps && to && isApproveFunction && isSpenderSwapsContract);
};

/**
 * For a MM Swap tx: Determines if the transaction is the actual swap tx where tokens are transferred
 */
export const getIsSwapTransaction = (
  data: string | undefined,
  origin: string | undefined,
  to: string | undefined,
  chainId: Hex,
): boolean => {
  const isSwapApproveOrSwapTransaction = getIsSwapApproveOrSwapTransaction(
    data,
    origin,
    to,
    chainId,
  );
  const isSwapApprove = getIsSwapApproveTransaction(data, origin, to, chainId);

  return isSwapApproveOrSwapTransaction && !isSwapApprove;
};

/**
 * For a MM Swap tx: Determines if the transaction is a native swap
 */
interface TxParams {
  value?: string;
}

export const getIsNativeTokenTransferred = (txParams: TxParams | undefined): boolean =>
  txParams?.value !== '0x0';

/**
 * Checks if the given token standard is non-fungible (ERC721 or ERC1155).
 *
 * @param {string} tokenStandard - The token standard to check.
 * @returns {boolean} - True if the token standard is ERC721 or ERC1155, otherwise false.
 */
export function isNFTTokenStandard(tokenStandard: string): boolean {
  return [ERC721, ERC1155].includes(tokenStandard);
}

/**
 * Get a transaction by its ID
 * @param {string} transactionId - The ID of the transaction to get
 * @param {TransactionController} transactionController - The transaction controller
 * @returns {TransactionMeta} The transaction meta object
 */
export function getTransactionById(
  transactionId: string,
  transactionController: TransactionController,
): TransactionMeta | undefined {
  return transactionController.state.transactions.find(
    (tx: TransactionMeta) => tx.id === transactionId,
  );
}
