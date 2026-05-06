import { addHexPrefix, toChecksumAddress } from 'ethereumjs-util';
import BN from 'bnjs4';
import { rawEncode, rawDecode } from 'ethereumjs-abi';
import BigNumber from 'bignumber.js';
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
  type TransactionParams,
} from '@metamask/transaction-controller';
import { swapsUtils } from '@metamask/swaps-controller';
import type { Hex } from '@metamask/utils';
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
};

const MULTIPLIER_HEX = 16;

const { getSwapsContractAddress } = swapsUtils;
/**
 * Utility class with the single responsibility
 * of caching CollectibleAddresses
 */
class CollectibleAddresses {
  static cache: Record<string, boolean> = {};
}

/**
 * Object containing all known action keys, to be used in transaction review
 */
const reviewActionKeys: Record<string, string> = {
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
const actionKeys: Record<string, string> = {
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

/**
 * Optional asset parameters used by {@link generateTransferData}.
 */
export interface TransferDataOptions {
  toAddress?: string;
  fromAddress?: string;
  amount?: string | number;
  tokenId?: string | number;
}

/**
 * Generates transfer data for specified method
 *
 * @param type - Method to use to generate data
 * @param opts - Optional asset parameters
 * @returns String containing the generated transfer data
 */
export function generateTransferData(
  type?: string,
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
              [
                opts.fromAddress,
                opts.toAddress,
                addHexPrefix(String(opts.tokenId)),
              ],
            ),
            (x: number) => ('00' + x.toString(16)).slice(-2),
          )
          .join('')
      );
    default:
      return undefined;
  }
}

/**
 * Extracts the four-byte signature from Ethereum transaction data.
 * @param data - The transaction data.
 * @returns The four-byte signature if data is provided, otherwise undefined.
 */
export function getFourByteSignature(data?: string): string | undefined {
  return data?.substring(0, 10);
}

/**
 * Checks if the transaction data corresponds to an "approve" or "increase allowance" function call.
 * @param data - The transaction data.
 * @returns True if the transaction is an "approve" or "increase allowance" call, false otherwise.
 */
export function isApprovalTransaction(data?: string): boolean {
  const fourByteSignature = getFourByteSignature(data);
  if (!fourByteSignature) return false;
  return [
    APPROVE_FUNCTION_SIGNATURE,
    INCREASE_ALLOWANCE_SIGNATURE,
    SET_APPROVAL_FOR_ALL_SIGNATURE,
  ].includes(fourByteSignature);
}

/**
 * Options for {@link generateApprovalData}.
 */
export interface ApprovalDataOptions {
  spender: string | null | undefined;
  value: string | null | undefined;
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

/**
 * Decoded approval data returned by {@link decodeApproveData}.
 */
export interface DecodedApproveData {
  spenderAddress: string;
  encodedAmount: string;
}

export function decodeApproveData(data: string): DecodedApproveData {
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
 * @returns Tuple of decoded transfer data
 */
export function decodeTransferData(
  type: string,
  data: string,
): string[] {
  switch (type) {
    case 'transfer': {
      const encodedAddress = data.substring(10, BASE + 10);
      const encodedAmount = data.substring(74, BASE + 74);
      const bufferEncodedAddress = rawEncode(
        ['address'],
        [addHexPrefix(encodedAddress)],
      );
      return [
        addHexPrefix(
          String(rawDecode(['address'], bufferEncodedAddress)[0]),
        ),
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
        addHexPrefix(
          String(rawDecode(['address'], bufferEncodedFromAddress)[0]),
        ),
        addHexPrefix(
          String(rawDecode(['address'], bufferEncodedToAddress)[0]),
        ),
        parseInt(encodedTokenId, 16).toString(),
      ];
    }
    default:
      return [];
  }
}

/**
 * Method data object containing the name if it is valid.
 */
export interface MethodData {
  name?: string;
}

/**
 * Returns method data object for a transaction data
 *
 * @param data - Transaction data
 * @param networkClientId - The network client id
 * @returns Method data object containing the name if is valid
 */
export async function getMethodData(
  data: string,
  networkClientId?: string,
): Promise<MethodData> {
  if (data.length < 10) return {};
  const fourByteSignature: string = data.substring(0, 10);
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
      fourByteSignature,
      networkClientId as string,
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
 * Returns whether the given address is a contract
 *
 * @param address - Ethereum address
 * @param chainId - Current chainId
 * @param networkClientId - ID of the network client
 * @returns Whether the given address is a contract
 */
export async function isSmartContractAddress(
  address: string,
  chainId: string,
  networkClientId: string | undefined = undefined,
): Promise<boolean> {
  if (!address) return false;

  const checksummedAddress = toChecksumAddress(address);

  // If in contract map we don't need to cache it
  if (
    isMainnetByChainId(chainId) &&
    Engine.context.TokenListController.state.tokensChainsCache?.[
      chainId as Hex
    ]?.data?.[checksummedAddress]
  ) {
    return Promise.resolve(true);
  }

  const { NetworkController } = Engine.context;
  const finalNetworkClientId =
    networkClientId ??
    NetworkController.findNetworkClientIdByChainId(chainId as Hex);
  const ethQuery = new EthQuery(
    NetworkController.getNetworkClientById(finalNetworkClientId).provider,
  );

  const code = checksummedAddress
    ? await query(ethQuery, 'getCode', [checksummedAddress])
    : undefined;

  return isSmartContractCode(code);
}

/**
 * Returns whether the given address is an ERC721 contract
 *
 * @param address - Ethereum address
 * @param tokenId - A possible collectible id
 * @returns Whether the given address is an ERC721 contract
 */
export async function isCollectibleAddress(
  address: string,
  tokenId: string,
): Promise<boolean> {
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
  const isCollectibleAddressResult = Boolean(ownerOf && ownerOf !== '0x');
  CollectibleAddresses.cache[address] = isCollectibleAddressResult;
  return isCollectibleAddressResult;
}

/**
 * Subset of {@link TransactionMeta} consumed by the action key helpers in
 * this module. Defined locally because callers (and tests) sometimes pass
 * partial objects that do not satisfy the full {@link TransactionMeta} type.
 */
export interface TransactionLike {
  networkClientId?: string;
  type?: string;
  txParams?: TransactionLikeParams;
  transaction?: TransactionLikeParams;
  toSmartContract?: boolean;
  isTransfer?: boolean;
  transferInformation?: {
    contractAddress: string;
    decimals: number;
    symbol: string;
  };
}

export interface TransactionLikeParams {
  data?: string;
  to?: string;
  from?: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

/**
 * Returns corresponding transaction action key
 *
 * @param transaction - Transaction object
 * @param chainId - Current chainId
 * @returns Corresponding transaction action key
 */
export async function getTransactionActionKey(
  transaction: TransactionLike,
  chainId: string,
): Promise<string> {
  const { networkClientId, type } = transaction ?? {};
  const txParams =
    transaction.txParams ?? transaction.transaction ?? {};
  const { data, to } = txParams;

  if (
    type !== undefined &&
    (
      [
        TransactionType.stakingClaim,
        TransactionType.stakingDeposit,
        TransactionType.stakingUnstake,
      ] as string[]
    ).includes(type)
  ) {
    return type;
  }

  if (!to) {
    return CONTRACT_METHOD_DEPLOY;
  }

  if (to === getSwapsContractAddress(chainId as Hex)) {
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
 * @param ticker - Ticker symbol of the active network
 * @param chainId - Current chainId
 * @returns Transaction type message
 */
export async function getActionKey(
  tx: TransactionLike,
  selectedAddress: string,
  ticker: string | undefined,
  chainId: string,
): Promise<string> {
  const actionKey = await getTransactionActionKey(tx, chainId);
  if (actionKey === SEND_ETHER_ACTION_KEY) {
    let currencySymbol = ticker;

    if (tx?.isTransfer) {
      const transferInformation = tx.transferInformation;
      if (transferInformation) {
        // Third party sending wrong token symbol
        if (
          transferInformation.contractAddress === SAI_ADDRESS.toLowerCase()
        ) {
          transferInformation.symbol = 'SAI';
        }
        currencySymbol = transferInformation.symbol;
      }
    }

    const incoming =
      tx.txParams?.to !== undefined &&
      safeToChecksumAddress(tx.txParams.to) === selectedAddress;
    const selfSent =
      incoming &&
      tx.txParams?.from !== undefined &&
      safeToChecksumAddress(tx.txParams.from) === selectedAddress;
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
  transaction: TransactionLike,
  chainId: string,
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
export function getTicker(ticker?: string): string {
  return ticker || strings('unit.eth');
}

/**
 * Asset object representing the network's native currency.
 */
export interface EtherAsset {
  name: string;
  address: string;
  symbol: string;
  logo: string;
  isETH: true;
}

/**
 * Construct ETH asset object
 *
 * @param ticker - Ticker
 * @returns ETH object
 */
export function getEther(ticker?: string): EtherAsset {
  return {
    name: 'Ether',
    address: '',
    symbol: ticker || strings('unit.eth'),
    logo: '../images/eth-logo-new.png',
    isETH: true,
  };
}

interface AddressBookEntry {
  name?: string;
}

interface InternalAccount {
  address: string;
  metadata: { name: string };
}

interface GetTransactionToNameOptions {
  addressBook: Record<string, Record<string, AddressBookEntry>>;
  chainId: string;
  toAddress: string;
  internalAccounts: InternalAccount[];
  ensRecipient?: string;
}

/**
 * Select the correct tx recipient name from available data
 *
 * @param config - Recipient lookup options
 * @returns Recipient name
 */
export function getTransactionToName({
  addressBook,
  chainId,
  toAddress,
  internalAccounts,
  ensRecipient,
}: GetTransactionToNameOptions): string | undefined {
  if (ensRecipient) {
    return ensRecipient;
  }

  const networkAddressBook = addressBook[chainId];
  const checksummedToAddress = toChecksumAddress(toAddress);

  // Convert internalAccounts array to a map for quick lookup
  const internalAccountsMap = internalAccounts.reduce<
    Record<string, InternalAccount>
  >((acc, account) => {
    acc[toChecksumAddress(account.address)] = account;
    return acc;
  }, {});

  const matchingAccount = internalAccountsMap[checksummedToAddress];

  const transactionToName =
    networkAddressBook?.[checksummedToAddress]?.name ||
    matchingAccount?.metadata.name;

  return transactionToName;
}

/**
 * Return a boolean if the transaction should be flagged to add the account added label
 *
 * @param transaction - Transaction object get time
 * @param addedAccountTime - Time the account was added to the wallet
 * @param accountAddedTimeInsertPointFound - Flag to see if the import time was already found
 */
export function addAccountTimeFlagFilter(
  transaction: { time: number },
  addedAccountTime: number,
  accountAddedTimeInsertPointFound: boolean,
): boolean {
  return (
    transaction.time <= addedAccountTime && !accountAddedTimeInsertPointFound
  );
}

/**
 * Shape of the redux `transaction` state slice consumed by
 * {@link getNormalizedTxState}. Indexed access is permissive because
 * downstream callers read many ad-hoc fields (e.g. `from`, `to`, `data`).
 */
interface TransactionStateSlice {
  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  transaction?: { transaction?: Record<string, unknown> } & Record<
    string,
    unknown
  >;
}

/**
 * Loose shape of the normalized transaction object returned by
 * {@link getNormalizedTxState}. Callers read many fields with varying
 * types, so the index signature falls back to {@link unknown}.
 */
export interface NormalizedTxState {
  from?: string;
  to?: string;
  data?: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
  nonce?: string;
  chainId?: string;
  type?: string;
  origin?: string;
  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  [key: string]: unknown;
}

//Leaving here a comment to re-visit this function since it's probably be possible to deprecate
export function getNormalizedTxState(
  state: TransactionStateSlice,
): NormalizedTxState {
  return state.transaction
    ? { ...state.transaction, ...state.transaction.transaction }
    : {};
}

interface BrowserTab {
  id: number;
  url: string;
}

interface BrowserState {
  tabs?: BrowserTab[];
  activeTab?: number;
}

export const getActiveTabUrl = ({
  browser = {},
}: {
  browser: BrowserState;
}): string =>
  (browser.tabs &&
    browser.activeTab !== undefined &&
    browser.tabs.find(({ id }) => id === browser.activeTab)?.url) ||
  '';

interface CalculateAmountsEIP1559Options {
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

interface CalculateAmountsEIP1559Result {
  totalMinNative: string;
  totalMinConversion: string;
  totalMaxNative: string;
  totalMaxConversion: string;
  totalMinHex: string;
  totalMaxHex: string;
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
}: CalculateAmountsEIP1559Options): CalculateAmountsEIP1559Result => {
  // amount numbers
  const amountConversion = String(
    getValueFromWeiHex({
      value,
      fromCurrency: nativeCurrency,
      toCurrency: currentCurrency,
      conversionRate,
      numberOfDecimals: 2,
      toDenomination: undefined,
    }),
  );
  const amountNative = String(
    getValueFromWeiHex({
      value,
      fromCurrency: nativeCurrency,
      toCurrency: nativeCurrency,
      conversionRate,
      numberOfDecimals: 6,
      toDenomination: undefined,
    }),
  );

  // Total numbers
  const totalMinNative = String(addEth(gasFeeMinNative, amountNative));
  const totalMinConversion = String(
    addFiat(gasFeeMinConversion, amountConversion),
  );
  const totalMaxNative = String(addEth(gasFeeMaxNative, amountNative));
  const totalMaxConversion = String(
    addFiat(gasFeeMaxConversion, amountConversion),
  );

  const totalMinHex = String(
    addCurrencies(gasFeeMinHex, value, {
      toNumericBase: 'hex',
      aBase: MULTIPLIER_HEX,
      bBase: MULTIPLIER_HEX,
    }),
  );

  const totalMaxHex = String(
    addCurrencies(gasFeeMaxHex, value, {
      toNumericBase: 'hex',
      aBase: MULTIPLIER_HEX,
      bBase: MULTIPLIER_HEX,
    }),
  );

  return {
    totalMinNative,
    totalMinConversion,
    totalMaxNative,
    totalMaxConversion,
    totalMinHex,
    totalMaxHex,
  };
};

interface CalculateEthEIP1559Options {
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
}: CalculateEthEIP1559Options): string[] => {
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

interface CalculateERC20EIP1559Options {
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
}: CalculateERC20EIP1559Options): string[] => {
  const tokenAmountConversion = convertTokenToFiat({
    value: tokenAmount,
    fromCurrency: nativeCurrency,
    toCurrency: currentCurrency,
    conversionRate,
    contractExchangeRate: exchangeRate,
  });

  const tokenTotalMinConversion = roundExponential(
    String(addFiat(tokenAmountConversion, totalMinConversion)),
  );
  const tokenTotalMaxConversion = roundExponential(
    String(addFiat(tokenAmountConversion, totalMaxConversion)),
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

interface GasFeeEstimateForLevel {
  maxWaitTimeEstimate?: number;
  minWaitTimeEstimate?: number;
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
}

interface GasFeeEstimatesShape {
  low?: GasFeeEstimateForLevel;
  medium?: GasFeeEstimateForLevel;
  high?: GasFeeEstimateForLevel;
  baseFeeTrend?: string;
  estimatedBaseFee?: string;
  historicalBaseFeeRange?: string[];
  historicalPriorityFeeRange?: string[];
  latestPriorityFeeRange?: string[];
  networkCongestion?: number;
  priorityFeeTrend?: string;
}

interface CalculateEIP1559TimesOptions {
  suggestedMaxPriorityFeePerGas: number | string;
  suggestedMaxFeePerGas: number | string;
  selectedOption?: string | null;
  recommended?: string;
  gasFeeEstimates?: GasFeeEstimatesShape;
}

interface CalculateEIP1559TimesResult {
  timeEstimate: string;
  timeEstimateColor: string;
  timeEstimateId?: string;
}

export const calculateEIP1559Times = ({
  suggestedMaxPriorityFeePerGas,
  suggestedMaxFeePerGas,
  selectedOption,
  recommended,
  gasFeeEstimates,
}: CalculateEIP1559TimesOptions): CalculateEIP1559TimesResult => {
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

    type GasLevel = 'low' | 'medium' | 'high';
    if (
      selectedOption &&
      gasFeeEstimates?.[LOW as GasLevel] &&
      gasFeeEstimates[MEDIUM as GasLevel] &&
      gasFeeEstimates[HIGH as GasLevel]
    ) {
      let hasTime = false;
      const lowEstimate = gasFeeEstimates[LOW as GasLevel];
      const highEstimate = gasFeeEstimates[HIGH as GasLevel];
      if (
        selectedOption === LOW &&
        lowEstimate?.maxWaitTimeEstimate !== undefined
      ) {
        timeEstimate = `${strings('times_eip1559.maybe')} ${humanizeDuration(
          lowEstimate.maxWaitTimeEstimate,
          timeParams,
        )}`;
        timeEstimateId = AppConstants.GAS_TIMES.MAYBE;
        hasTime = true;
      } else if (
        selectedOption === MEDIUM &&
        lowEstimate?.maxWaitTimeEstimate !== undefined
      ) {
        timeEstimate = `${strings('times_eip1559.likely')} ${humanizeDuration(
          lowEstimate.maxWaitTimeEstimate,
          timeParams,
        )}`;
        timeEstimateId = AppConstants.GAS_TIMES.LIKELY;
        hasTime = true;
      } else if (
        selectedOption === HIGH &&
        highEstimate?.minWaitTimeEstimate !== undefined
      ) {
        timeEstimate = `${strings(
          'times_eip1559.likely_in',
        )} ${humanizeDuration(
          highEstimate.minWaitTimeEstimate,
          timeParams,
        )}`;
        timeEstimateId = AppConstants.GAS_TIMES.VERY_LIKELY;
        hasTime = true;
      }

      if (
        highEstimate &&
        Number(suggestedMaxPriorityFeePerGas) >=
          Number(highEstimate.suggestedMaxPriorityFeePerGas)
      ) {
        timeEstimate = `${strings(
          'times_eip1559.likely_in',
        )} ${humanizeDuration(
          highEstimate.minWaitTimeEstimate ?? 0,
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
      String(suggestedMaxPriorityFeePerGas),
      String(suggestedMaxFeePerGas),
    ) as { lowerTimeBound?: number; upperTimeBound?: number | 'unknown' } | 'unknown';

    if (
      !times ||
      (times as unknown) === 'unknown' ||
      Object.keys(times).length < 2 ||
      (times as { upperTimeBound?: unknown }).upperTimeBound === 'unknown'
    ) {
      timeEstimate = strings('times_eip1559.unknown');
      timeEstimateId = AppConstants.GAS_TIMES.UNKNOWN;
      timeEstimateColor = 'red';
    } else {
      const bounds = times as {
        lowerTimeBound?: number;
        upperTimeBound?: number;
      };
      const lowerBound = bounds.lowerTimeBound ?? 0;
      const upperBound = bounds.upperTimeBound ?? 0;
      if (selectedOption === LOW) {
        timeEstimate = `${strings('times_eip1559.maybe')} ${humanizeDuration(
          upperBound,
          timeParams,
        )}`;
        timeEstimateId = AppConstants.GAS_TIMES.MAYBE;
      } else if (selectedOption === MEDIUM) {
        timeEstimate = `${strings('times_eip1559.likely')} ${humanizeDuration(
          upperBound,
          timeParams,
        )}`;
        timeEstimateId = AppConstants.GAS_TIMES.LIKELY;
      } else if (selectedOption === HIGH) {
        timeEstimate = `${strings(
          'times_eip1559.very_likely',
        )} ${humanizeDuration(upperBound, timeParams)}`;
        timeEstimateId = AppConstants.GAS_TIMES.VERY_LIKELY;
      } else if (upperBound === 0) {
        timeEstimate = `${strings('times_eip1559.at_least')} ${humanizeDuration(
          lowerBound,
          timeParams,
        )}`;
        timeEstimateColor = 'red';
        timeEstimateId = AppConstants.GAS_TIMES.AT_LEAST;
      } else if (lowerBound === 0) {
        timeEstimate = `${strings('times_eip1559.less_than')} ${humanizeDuration(
          upperBound,
          timeParams,
        )}`;
        timeEstimateColor = 'green';
        timeEstimateId = AppConstants.GAS_TIMES.LESS_THAN;
      } else {
        timeEstimate = `${humanizeDuration(
          lowerBound,
          timeParams,
        )} - ${humanizeDuration(upperBound, timeParams)}`;
        timeEstimateId = AppConstants.GAS_TIMES.RANGE;
      }
    }
  } catch (error) {
    Logger.log('ERROR ESTIMATING TIME', error);
  }
  if (!timeEstimateId) {
    timeEstimate = AppConstants.GAS_TIMES.UNKNOWN;
  }

  return { timeEstimate, timeEstimateColor, timeEstimateId };
};

interface CalculateEIP1559GasFeeHexesOptions {
  gasLimitHex: string;
  estimatedGasLimitHex?: string;
  estimatedBaseFeeHex: string;
  suggestedMaxFeePerGasHex: string;
  suggestedMaxPriorityFeePerGasHex: string;
}

interface CalculateEIP1559GasFeeHexesResult {
  estimatedBaseFee_PLUS_suggestedMaxPriorityFeePerGasHex: string;
  maxPriorityFeePerGasTimesGasLimitHex: string;
  gasFeeMinHex: string;
  gasFeeMaxHex: string;
}

export const calculateEIP1559GasFeeHexes = ({
  gasLimitHex,
  estimatedGasLimitHex,
  estimatedBaseFeeHex,
  suggestedMaxFeePerGasHex,
  suggestedMaxPriorityFeePerGasHex,
}: CalculateEIP1559GasFeeHexesOptions): CalculateEIP1559GasFeeHexesResult => {
  // Hex calculations
  const estimatedBaseFee_PLUS_suggestedMaxPriorityFeePerGasHex = String(
    addCurrencies(estimatedBaseFeeHex, suggestedMaxPriorityFeePerGasHex, {
      toNumericBase: 'hex',
      aBase: MULTIPLIER_HEX,
      bBase: MULTIPLIER_HEX,
    }),
  );

  const maxPriorityFeePerGasTimesGasLimitHex = String(
    multiplyCurrencies(suggestedMaxPriorityFeePerGasHex, gasLimitHex, {
      toNumericBase: 'hex',
      multiplicandBase: MULTIPLIER_HEX,
      multiplierBase: MULTIPLIER_HEX,
    }),
  );

  const gasFeeMinHex = String(
    multiplyCurrencies(
      estimatedBaseFee_PLUS_suggestedMaxPriorityFeePerGasHex,
      estimatedGasLimitHex || gasLimitHex,
      {
        toNumericBase: 'hex',
        multiplicandBase: MULTIPLIER_HEX,
        multiplierBase: MULTIPLIER_HEX,
      },
    ),
  );
  const gasFeeMaxHex = String(
    multiplyCurrencies(suggestedMaxFeePerGasHex, gasLimitHex, {
      toNumericBase: 'hex',
      multiplicandBase: MULTIPLIER_HEX,
      multiplierBase: MULTIPLIER_HEX,
    }),
  );

  return {
    estimatedBaseFee_PLUS_suggestedMaxPriorityFeePerGasHex,
    maxPriorityFeePerGasTimesGasLimitHex,
    gasFeeMinHex,
    gasFeeMaxHex,
  };
};

interface SelectedGasFee {
  suggestedMaxPriorityFeePerGas?: string | number;
  suggestedMaxFeePerGas?: string | number;
  suggestedGasPrice?: string | number;
  suggestedGasLimit?: string | number;
  suggestedGasLimitHex?: string;
  suggestedEstimatedGasLimit?: string | number;
  estimatedBaseFee?: string | number | null;
  selectedOption?: string | null;
  recommended?: string;
  // Allow extra fields callers pass through (e.g. wait-time estimates).
  [key: string]: unknown;
}

interface SwapsParams {
  tradeValue: string;
  isNativeAsset: boolean;
  sourceAmount: string;
}

interface SelectedAsset {
  isETH?: boolean;
  address?: string;
  symbol?: string;
  decimals?: number;
  tokenId?: string;
}

interface ParseTransactionState {
  selectedAsset?: SelectedAsset;
  transaction?: { value?: string; data?: string };
}

type ContractExchangeRate = number | { price?: number } | unknown;
type ContractExchangeRatesMap = Record<string, ContractExchangeRate>;

function extractExchangeRate(rate: unknown): number | undefined {
  if (typeof rate === 'number') {
    return rate;
  }
  if (rate !== null && typeof rate === 'object' && 'price' in rate) {
    const price = (rate as { price?: unknown }).price;
    return typeof price === 'number' ? price : undefined;
  }
  return undefined;
}

interface ParseTransactionEIP1559Options {
  selectedGasFee: SelectedGasFee | string;
  swapsParams?: SwapsParams;
  contractExchangeRates?: ContractExchangeRatesMap;
  conversionRate: number;
  currentCurrency: string;
  nativeCurrency: string;
  transactionState?: ParseTransactionState;
  gasFeeEstimates?: GasFeeEstimatesShape;
}

interface ParseTransactionExtraOptions {
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
    transactionState,
    gasFeeEstimates,
  }: ParseTransactionEIP1559Options,
  { onlyGas }: ParseTransactionExtraOptions = {},
): Record<string, unknown> => {
  const { selectedAsset = {}, transaction = {} } = transactionState ?? {};
  const { value: rawValue, data } = transaction;
  const value = rawValue || '0x0';
  const gasFee: SelectedGasFee =
    typeof selectedGasFee === 'object' && selectedGasFee !== null
      ? selectedGasFee
      : {};

  const suggestedMaxPriorityFeePerGas = String(
    gasFee.suggestedMaxPriorityFeePerGas,
  );
  const suggestedMaxFeePerGas = String(gasFee.suggestedMaxFeePerGas);
  const estimatedBaseFee = String(gasFee.estimatedBaseFee || '0');

  // Convert to hex
  const estimatedBaseFeeHex = decGWEIToHexWEI(estimatedBaseFee);
  const suggestedMaxPriorityFeePerGasHex = decGWEIToHexWEI(
    suggestedMaxPriorityFeePerGas,
  );
  const suggestedMaxFeePerGasHex = decGWEIToHexWEI(suggestedMaxFeePerGas);
  const gasLimitHex = BNToHex(
    new BN(String(gasFee.suggestedGasLimit ?? '0')),
  );
  const estimatedGasLimitHex = gasFee.suggestedEstimatedGasLimit
    ? BNToHex(new BN(String(gasFee.suggestedEstimatedGasLimit)))
    : undefined;

  const { timeEstimate, timeEstimateColor, timeEstimateId } =
    calculateEIP1559Times({
      suggestedMaxPriorityFeePerGas,
      suggestedMaxFeePerGas,
      selectedOption: gasFee.selectedOption,
      recommended: gasFee.recommended,
      gasFeeEstimates,
    });

  // eslint-disable-next-line prefer-const
  let { gasFeeMinHex, gasFeeMaxHex, maxPriorityFeePerGasTimesGasLimitHex } =
    calculateEIP1559GasFeeHexes({
      gasLimitHex: String(gasLimitHex),
      estimatedGasLimitHex: estimatedGasLimitHex
        ? String(estimatedGasLimitHex)
        : undefined,
      estimatedBaseFeeHex: String(estimatedBaseFeeHex),
      suggestedMaxPriorityFeePerGasHex: String(suggestedMaxPriorityFeePerGasHex),
      suggestedMaxFeePerGasHex: String(suggestedMaxFeePerGasHex),
    });

  if (swapsParams) {
    const { tradeValue, isNativeAsset, sourceAmount } = swapsParams;
    gasFeeMinHex = String(
      addCurrencies(gasFeeMinHex, tradeValue, {
        toNumericBase: 'hex',
        aBase: MULTIPLIER_HEX,
        bBase: MULTIPLIER_HEX,
      }),
    );
    gasFeeMaxHex = String(
      addCurrencies(gasFeeMaxHex, tradeValue, {
        toNumericBase: 'hex',
        aBase: MULTIPLIER_HEX,
        bBase: MULTIPLIER_HEX,
      }),
    );

    if (isNativeAsset) {
      gasFeeMinHex = String(
        subtractCurrencies(gasFeeMinHex, sourceAmount, {
          toNumericBase: 'hex',
          aBase: MULTIPLIER_HEX,
          bBase: 10,
        }),
      );
      gasFeeMaxHex = String(
        subtractCurrencies(gasFeeMaxHex, sourceAmount, {
          toNumericBase: 'hex',
          aBase: MULTIPLIER_HEX,
          bBase: 10,
        }),
      );
    }
  }

  const maxPriorityFeeNative = String(
    getTransactionFee({
      value: maxPriorityFeePerGasTimesGasLimitHex,
      fromCurrency: nativeCurrency,
      toCurrency: nativeCurrency,
      numberOfDecimals: 6,
      conversionRate,
    }),
  );
  const maxPriorityFeeConversion = String(
    getTransactionFee({
      value: maxPriorityFeePerGasTimesGasLimitHex,
      fromCurrency: nativeCurrency,
      toCurrency: currentCurrency,
      numberOfDecimals: 2,
      conversionRate,
    }),
  );

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

  const maxFeePerGasNative = String(
    getTransactionFee({
      value: gasFeeMaxHex,
      fromCurrency: nativeCurrency,
      toCurrency: nativeCurrency,
      numberOfDecimals: 6,
      conversionRate,
    }),
  );
  const maxFeePerGasConversion = String(
    getTransactionFee({
      value: gasFeeMaxHex,
      fromCurrency: nativeCurrency,
      toCurrency: currentCurrency,
      numberOfDecimals: 2,
      conversionRate,
    }),
  );
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
  const gasFeeMinNative = String(
    getTransactionFee({
      value: gasFeeMinHex,
      fromCurrency: nativeCurrency,
      toCurrency: nativeCurrency,
      numberOfDecimals: 6,
      conversionRate,
    }),
  );
  const gasFeeMinConversion = String(
    getTransactionFee({
      value: gasFeeMinHex,
      fromCurrency: nativeCurrency,
      toCurrency: currentCurrency,
      numberOfDecimals: 2,
      conversionRate,
    }),
  );

  // Gas fee max numbers
  const gasFeeMaxNative = String(
    getTransactionFee({
      value: gasFeeMaxHex,
      fromCurrency: nativeCurrency,
      toCurrency: nativeCurrency,
      numberOfDecimals: 6,
      conversionRate,
    }),
  );
  const gasFeeMaxConversion = String(
    getTransactionFee({
      value: gasFeeMaxHex,
      fromCurrency: nativeCurrency,
      toCurrency: currentCurrency,
      numberOfDecimals: 2,
      conversionRate,
    }),
  );

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
      suggestedGasLimit: gasFee.suggestedGasLimit,
      suggestedEstimatedGasLimit: gasFee.suggestedEstimatedGasLimit,
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
  });

  let renderableTotalMinNative,
    renderableTotalMinConversion,
    renderableTotalMaxNative,
    renderableTotalMaxConversion;

  if (selectedAsset?.isETH || selectedAsset?.tokenId) {
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
    const {
      address,
      symbol = 'ERC20',
      decimals,
    } = (selectedAsset ?? {}) as {
      address?: string;
      symbol?: string;
      decimals?: number;
    };

    const [, , rawAmount] = decodeTransferData('transfer', data ?? '');
    const rawAmountString = parseInt(rawAmount, 16).toLocaleString('fullwide', {
      useGrouping: false,
    });
    const tokenAmount = renderFromTokenMinimalUnit(
      rawAmountString,
      decimals as number,
    );

    const exchangeRate = address
      ? extractExchangeRate(contractExchangeRates?.[address])
      : undefined;

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
    suggestedGasLimit: gasFee.suggestedGasLimit,
    totalMinHex,
    totalMaxHex,
  };
};

interface ParseTransactionLegacyOptions {
  contractExchangeRates?: ContractExchangeRatesMap;
  conversionRate: number;
  currentCurrency: string;
  transactionState?: ParseTransactionState;
  ticker?: string;
  selectedGasFee: SelectedGasFee | string;
  multiLayerL1FeeTotal?: string;
}

export const parseTransactionLegacy = (
  {
    contractExchangeRates,
    conversionRate,
    currentCurrency,
    transactionState,
    ticker,
    selectedGasFee,
    multiLayerL1FeeTotal,
  }: ParseTransactionLegacyOptions,
  { onlyGas }: ParseTransactionExtraOptions = {},
): Record<string, unknown> => {
  const { selectedAsset = {}, transaction = {} } = transactionState ?? {};
  const { value, data } = transaction;
  const gasFee: SelectedGasFee =
    typeof selectedGasFee === 'object' && selectedGasFee !== null
      ? selectedGasFee
      : {};
  const suggestedGasLimitString = String(gasFee.suggestedGasLimit ?? '0');
  const gasLimit = new BN(suggestedGasLimitString);
  const gasLimitHex = BNToHex(new BN(suggestedGasLimitString));

  let weiTransactionFee = gasLimit?.mul(
    hexToBN(decGWEIToHexWEI(String(gasFee.suggestedGasPrice ?? '0'))),
  );
  if (multiLayerL1FeeTotal) {
    weiTransactionFee = hexToBN(
      sumHexWEIs([BNToHex(weiTransactionFee), multiLayerL1FeeTotal]),
    );
  }

  const suggestedGasPriceHex = decGWEIToHexWEI(
    String(gasFee.suggestedGasPrice ?? '0'),
  );

  const valueBN = value ? hexToBN(value) : hexToBN('0x0');
  const transactionFeeFiat = weiToFiat(
    weiTransactionFee as BN,
    conversionRate,
    currentCurrency,
  );
  const parsedTicker = getTicker(ticker);
  const transactionFee = `${renderFromWei(
    weiTransactionFee as BN,
  )} ${parsedTicker}`;

  const totalHex = valueBN.add(weiTransactionFee);

  if (onlyGas) {
    return {
      transactionFeeFiat,
      transactionFee,
      suggestedGasPrice: gasFee.suggestedGasPrice,
      suggestedGasPriceHex,
      suggestedGasLimit: gasFee.suggestedGasLimit,
      suggestedGasLimitHex: gasLimitHex,
      totalHex,
    };
  }

  let transactionTotalAmount: string | undefined;
  let transactionTotalAmountFiat: string | undefined;

  if (selectedAsset?.isETH) {
    const transactionTotalAmountBN = weiTransactionFee?.add(valueBN);
    transactionTotalAmount = `${renderFromWei(
      transactionTotalAmountBN,
    )} ${parsedTicker}`;
    transactionTotalAmountFiat = weiToFiat(
      transactionTotalAmountBN,
      conversionRate,
      currentCurrency,
    );
  } else if (selectedAsset?.tokenId) {
    const transactionTotalAmountBN = weiTransactionFee?.add(valueBN);
    transactionTotalAmount = `${renderFromWei(
      weiTransactionFee,
    )} ${parsedTicker}`;

    transactionTotalAmountFiat = weiToFiat(
      transactionTotalAmountBN,
      conversionRate,
      currentCurrency,
    );
  } else if (data) {
    const {
      address,
      symbol = 'ERC20',
      decimals,
    } = (selectedAsset ?? {}) as {
      address?: string;
      symbol?: string;
      decimals?: number;
    };
    const [, , rawAmount] = decodeTransferData('transfer', data);
    const rawAmountString = parseInt(rawAmount, 16).toLocaleString('fullwide', {
      useGrouping: false,
    });
    const transferValue = renderFromTokenMinimalUnit(
      rawAmountString,
      decimals as number,
    );
    const transactionValue = `${transferValue} ${symbol}`;
    const exchangeRate = address
      ? extractExchangeRate(contractExchangeRates?.[address])
      : undefined;
    const transactionFeeFiatNumber = weiToFiatNumber(
      weiTransactionFee,
      conversionRate,
    );

    const transactionValueFiatNumber = balanceToFiatNumber(
      transferValue,
      conversionRate,
      exchangeRate as number,
    );
    transactionTotalAmount = `${transactionValue} + ${renderFromWei(
      weiTransactionFee as BN,
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
    suggestedGasPrice: gasFee.suggestedGasPrice,
    suggestedGasPriceHex,
    suggestedGasLimit: gasFee.suggestedGasLimit,
    suggestedGasLimitHex: gasLimitHex,
    totalHex,
  };
};

interface ValidateTransactionAccount {
  balance: string;
}

interface ValidateTransactionInput {
  transaction: {
    from?: string;
    gas?: string;
    gasPrice?: string;
    value?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
  };
}

/**
 * Validate transaction value for speed up or cancel transaction actions
 *
 * @param transaction - Transaction object to validate
 * @param rate - Rate to validate
 * @param accounts - Map of accounts to information objects including balances
 * @returns Whether the balance is validated or not
 */
export function validateTransactionActionBalance(
  transaction: ValidateTransactionInput,
  rate: number,
  accounts: Record<string, ValidateTransactionAccount>,
): boolean {
  try {
    if (!transaction.transaction.from) {
      return false;
    }
    const checksummedFrom = safeToChecksumAddress(transaction.transaction.from);
    if (!checksummedFrom) {
      return false;
    }
    const balance = accounts[checksummedFrom].balance;

    let gasPrice = transaction.transaction.gasPrice;
    const transactionToCheck = transaction.transaction;

    if (isEIP1559Transaction(transactionToCheck as TransactionParams)) {
      gasPrice = transactionToCheck.maxFeePerGas;
    }

    if (
      gasPrice === undefined ||
      transaction.transaction.gas === undefined ||
      transaction.transaction.value === undefined
    ) {
      return false;
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
 * Shape of the ethers Interface token data consumed by the helpers below.
 */
export interface TokenDataLike {
  args?: {
    _to?: { toString: () => string };
    _value?: { _hex?: string; toString: () => string };
    [key: number]: { toString?: () => string; _hex?: string } | undefined;
  };
}

/**
 * Attempts to get the address parameter of the given token transaction data
 * (i.e. function call) per the Human Standard Token ABI, in the following
 * order: The '_to' parameter, if present, otherwise the first parameter.
 *
 * @param tokenData - ethers Interface token data.
 * @returns A lowercase address string.
 */
export function getTokenAddressParam(
  tokenData: TokenDataLike = {},
): string | undefined {
  const arg0 = tokenData?.args?.[0];
  const value = tokenData?.args?._to || arg0;
  return value?.toString?.().toLowerCase();
}

/**
 * Gets the '_hex' parameter of the given token transaction data
 * (i.e function call) per the Human Standard Token ABI, if present.
 *
 * @param tokenData - ethers Interface token data.
 * @returns A hex string value.
 */
export function getTokenValueParamAsHex(
  tokenData: TokenDataLike = {},
): string | undefined {
  const arg1 = tokenData?.args?.[1];
  const value = tokenData?.args?._value?._hex || arg1?._hex;
  return value?.toLowerCase();
}

/**
 * Gets the '_value' parameter of the given token transaction data
 * (i.e function call) per the Human Standard Token ABI, if present.
 *
 * @param tokenData - ethers Interface token data.
 * @returns A decimal string value.
 */
export function getTokenValueParam(
  tokenData: TokenDataLike = {},
): string | undefined {
  return tokenData?.args?._value?.toString();
}

interface TokenParam {
  name: string;
  value: string;
}

export function getTokenValue(
  tokenParams: TokenParam[] = [],
): string | undefined {
  const valueData = tokenParams.find((param) => param.name === '_value');
  return valueData?.value;
}

/**
 * Transaction-like input accepted by {@link generateTxWithNewTokenAllowance}.
 * Mirrors the JS contract: only `data` is accessed; everything else is spread.
 */
export interface TxWithDataLike extends Record<string, unknown> {
  data?: string;
}

/**
 * Generates a new transaction with the token allowance
 * @param tokenValue - value for the token allowance
 * @param tokenDecimals - Token decimal
 * @param spenderAddress - Address to which the allowance will be granted
 * @param transaction - Transaction to update
 * @returns A new transaction object with the token allowance encoded
 */
export const generateTxWithNewTokenAllowance = (
  tokenValue: string | number | BN,
  tokenDecimals: number,
  spenderAddress: string,
  transaction: TxWithDataLike,
): TxWithDataLike & { data: string } => {
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
 * @param tokenDecimals - Token decimal
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
  chainId: string,
): boolean => {
  if (!data) {
    return false;
  }

  // if approval data includes metaswap contract
  // if destination address is metaswap contract
  return Boolean(
    origin === process.env.MM_FOX_CODE &&
      to &&
      (swapsUtils.isValidContractAddress(chainId as Hex, to) ||
        (data?.startsWith(APPROVE_FUNCTION_SIGNATURE) &&
          decodeApproveData(data).spenderAddress?.toLowerCase() ===
            swapsUtils.getSwapsContractAddress(chainId as Hex))),
  );
};

/**
 * For a MM Swap tx: Determines if the transaction is an ERC20 approve tx
 */
export const getIsSwapApproveTransaction = (
  data: string | undefined,
  origin: string | undefined,
  to: string | undefined,
  chainId: string,
): boolean => {
  if (!data) {
    return false;
  }

  const isFromSwaps = origin === process.env.MM_FOX_CODE;
  const isApproveFunction =
    !!data && getFourByteSignature(data) === APPROVE_FUNCTION_SIGNATURE;
  const isSpenderSwapsContract =
    decodeApproveData(data).spenderAddress?.toLowerCase() ===
    swapsUtils.getSwapsContractAddress(chainId as Hex);

  return Boolean(isFromSwaps && to && isApproveFunction && isSpenderSwapsContract);
};

/**
 * For a MM Swap tx: Determines if the transaction is the actual swap tx where tokens are transferred
 */
export const getIsSwapTransaction = (
  data: string | undefined,
  origin: string | undefined,
  to: string | undefined,
  chainId: string,
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
export const getIsNativeTokenTransferred = (txParams?: {
  value?: string;
}): boolean => txParams?.value !== '0x0';

/**
 * Checks if the given token standard is non-fungible (ERC721 or ERC1155).
 *
 * @param tokenStandard - The token standard to check.
 * @returns True if the token standard is ERC721 or ERC1155, otherwise false.
 */
export function isNFTTokenStandard(tokenStandard: string): boolean {
  return [ERC721, ERC1155].includes(tokenStandard);
}

/**
 * Subset of the {@link TransactionController} surface used by
 * {@link getTransactionById}. Defined locally because the full
 * controller type from `@metamask/transaction-controller` requires generic
 * parameters that callers in this repo do not supply.
 */
export interface TransactionControllerLike<
  T extends { id: string } = TransactionMeta,
> {
  state: { transactions: T[] };
}

/**
 * Get a transaction by its ID
 * @param transactionId - The ID of the transaction to get
 * @param transactionController - The transaction controller
 * @returns The transaction meta object
 */
export function getTransactionById<T extends { id: string }>(
  transactionId: string,
  transactionController: TransactionControllerLike<T>,
): T | undefined {
  return transactionController.state.transactions.find(
    (tx) => tx.id === transactionId,
  );
}
