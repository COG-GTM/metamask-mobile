import { addHexPrefix, toChecksumAddress } from 'ethereumjs-util';
import BN from 'bnjs4';
import { rawEncode, rawDecode } from 'ethereumjs-abi';
import BigNumber from 'bignumber.js';
import humanizeDuration from 'humanize-duration';

type BN4 = InstanceType<typeof BN>;
import {
  query,
  isSmartContractCode,
  ERC721,
  ERC1155,
} from '@metamask/controller-utils';
import {
  isEIP1559Transaction,
  TransactionType,
} from '@metamask/transaction-controller';
import { swapsUtils } from '@metamask/swaps-controller';
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
 * Generates transfer data for specified method
 *
 * @param {String} type - Method to use to generate data
 * @param {Object} opts - Optional asset parameters
 * @returns {String} - String containing the generated transfer data
 */
interface TransferDataOpts {
  toAddress?: string;
  fromAddress?: string;
  amount?: string | number;
  tokenId?: string | number;
}

export function generateTransferData(
  type: string | undefined = undefined,
  opts: TransferDataOpts = {},
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
                addHexPrefix(String(opts.tokenId ?? '')),
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
 * @param {string | undefined} data The transaction data.
 * @returns {string | undefined} The four-byte signature if data is provided, otherwise undefined.
 */
export function getFourByteSignature(data: string | undefined): string | undefined {
  return data?.substring(0, 10);
}

/**
 * Checks if the transaction data corresponds to an "approve" or "increase allowance" function call.
 * @param {string} data The transaction data.
 * @returns {boolean} True if the transaction is an "approve" or "increase allowance" call, false otherwise.
 */
export function isApprovalTransaction(data: string): boolean {
  const fourByteSignature = getFourByteSignature(data);
  if (!fourByteSignature) return false;
  return [
    APPROVE_FUNCTION_SIGNATURE,
    INCREASE_ALLOWANCE_SIGNATURE,
    SET_APPROVAL_FOR_ALL_SIGNATURE,
  ].includes(fourByteSignature);
}

/**
 * Generates ERC20 approval data
 *
 * @param {object} opts - Object containing spender address, value and data
 * @param {string | null} opts.spender - The address of the spender
 * @param {string} opts.value - The amount of tokens to be approved or increased
 * @param {string} [opts.data] - The data of the transaction
 * @returns {String} - String containing the generated data, by default for approve method
 */
interface ApprovalDataOpts {
  spender: string | null;
  value: string;
  data?: string;
}

export function generateApprovalData(opts: ApprovalDataOpts): string {
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

export function decodeApproveData(
  data: string,
): { spenderAddress: string; encodedAmount: string } {
  return {
    spenderAddress: addHexPrefix(data.substr(34, 40)),
    encodedAmount: data.substr(74, 138),
  };
}

const BASE = 4 * 16;

/**
 * Decode transfer data for specified method data
 *
 * @param {String} type - Method to use to generate data
 * @param {String} data - Data to decode
 * @returns {Array} - Object containing the decoded transfer data
 */
export function decodeTransferData(
  type: string,
  data: string,
): string[] | undefined {
  switch (type) {
    case 'transfer': {
      const encodedAddress = data.substring(10, BASE + 10);
      const encodedAmount = data.substring(74, BASE + 74);
      const bufferEncodedAddress = rawEncode(
        ['address'],
        [addHexPrefix(encodedAddress)],
      );
      return [
        addHexPrefix(String(rawDecode(['address'], bufferEncodedAddress)[0])),
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
      return undefined;
  }
}

/**
 * @typedef {Object} MethodData
 * @property {string} name - The method name
 */

/**
 * Returns method data object for a transaction dat
 *
 * @param {string} data - Transaction data
 * @returns {MethodData} - Method data object containing the name if is valid
 */
interface MethodData {
  name?: string;
}

export async function getMethodData(
  data: string,
  networkClientId?: string,
): Promise<MethodData> {
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
    if (!fourByteSignature) {
      return {};
    }
    const registryObject = await handleMethodData(
      fourByteSignature,
      (networkClientId ?? '') as string,
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
 * @param {string} address - Ethereum address
 * @param {string} chainId - Current chainId
 * @param {string | undefined} networkClientId - ID of the network client
 * @returns {Promise<boolean>} - Whether the given address is a contract
 */
export async function isSmartContractAddress(
  address: string,
  chainId: string,
  networkClientId: string | undefined = undefined,
): Promise<boolean> {
  if (!address) return false;

  address = toChecksumAddress(address);

  // If in contract map we don't need to cache it
  const tokensChainsCache = (
    Engine.context.TokenListController.state
      .tokensChainsCache as unknown as Record<
      string,
      { data?: Record<string, unknown> }
    >
  )?.[chainId];
  if (
    isMainnetByChainId(chainId) &&
    tokensChainsCache?.data?.[address]
  ) {
    return Promise.resolve(true);
  }

  const { NetworkController } = Engine.context;
  const finalNetworkClientId =
    networkClientId ??
    NetworkController.findNetworkClientIdByChainId(
      chainId as `0x${string}`,
    );
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
 * @param {string} address - Ethereum address
 * @param {string} tokenId - A possible collectible id
 * @returns {boolean} - Wether the given address is an ERC721 contract
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
  const isCollectible = Boolean(ownerOf && ownerOf !== '0x');
  CollectibleAddresses.cache[address] = isCollectible;
  return isCollectible;
}

/**
 * Returns corresponding transaction action key
 *
 * @param {object} transaction - Transaction object
 * @param {string} chainId - Current chainId
 * @returns {string} - Corresponding transaction action key
 */
interface TransactionLike {
  networkClientId?: string;
  type?: string;
  txParams?: { data?: string; to?: string; from?: string };
  transaction?: { data?: string; to?: string; from?: string };
  toSmartContract?: boolean;
  isTransfer?: boolean;
  transferInformation?: { contractAddress?: string; symbol?: string };
  time?: number;
}

export async function getTransactionActionKey(
  transaction: TransactionLike,
  chainId: string,
): Promise<string> {
  const { networkClientId, type } = transaction ?? {};
  const txParams = transaction.txParams ?? transaction.transaction ?? {};
  const { data, to } = txParams;

  if (
    type &&
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

  if (to === getSwapsContractAddress(chainId as `0x${string}`)) {
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
 * @param {object} tx - Transaction object
 * @param {string} selectedAddress - Current account public address
 * @returns {string} - Transaction type message
 */
export async function getActionKey(
  tx: TransactionLike,
  selectedAddress: string,
  ticker: string | undefined,
  chainId: string,
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

    const incoming =
      safeToChecksumAddress(tx.txParams?.to ?? '') === selectedAddress;
    const selfSent =
      incoming &&
      safeToChecksumAddress(tx.txParams?.from ?? '') === selectedAddress;
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
 * @param {object} tx - Transaction object
 * @param {string} chainId - Current chainId
 * @returns {string} - Transaction function type
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
 * @param {string} - Ticker
 * @returns {string} - Corresponding ticker or ETH
 */
export function getTicker(ticker: string | undefined): string {
  return ticker || strings('unit.eth');
}

/**
 * Construct ETH asset object
 *
 * @param {string} ticker - Ticker
 * @returns {object} - ETH object
 */
interface EtherAsset {
  name: string;
  address: string;
  symbol: string;
  logo: string;
  isETH: boolean;
}

export function getEther(ticker: string | undefined): EtherAsset {
  return {
    name: 'Ether',
    address: '',
    symbol: ticker || strings('unit.eth'),
    logo: '../images/eth-logo-new.png',
    isETH: true,
  };
}

/**
 * Select the correct tx recipient name from available data
 *
 * @param {object} config
 * @param {object} config.addressBook - Object of address book entries
 * @param {string} config.chainId - network id
 * @param {string} config.toAddress - hex address of tx recipient
 * @param {array} config.internalAccounts - array of accounts objects from AccountsController
 * @param {string} config.ensRecipient - name of ens recipient
 * @returns {string} - recipient name
 */
interface AddressBookEntry {
  name?: string;
}

interface InternalAccountTx {
  address: string;
  metadata: { name: string };
}

interface GetTransactionToNameArgs {
  addressBook: Record<string, Record<string, AddressBookEntry>>;
  chainId: string;
  toAddress: string;
  internalAccounts: InternalAccountTx[];
  ensRecipient?: string;
}

export function getTransactionToName({
  addressBook,
  chainId,
  toAddress,
  internalAccounts,
  ensRecipient,
}: GetTransactionToNameArgs): string | undefined {
  if (ensRecipient) {
    return ensRecipient;
  }

  const networkAddressBook = addressBook[chainId];
  const checksummedToAddress = toChecksumAddress(toAddress);

  // Convert internalAccounts array to a map for quick lookup
  const internalAccountsMap = internalAccounts.reduce<
    Record<string, InternalAccountTx>
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
 * Return a boolen if the transaction should be flagged to add the account added label
 *
 * @param {object} transaction - Transaction object get time
 * @param {object} addedAccountTime - Time the account was added to the wallet
 * @param {object} accountAddedTimeInsertPointFound - Flag to see if the import time was already found
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

//Leaving here a comment to re-visit this function since it's probably be possible to deprecate
// `from` is intentionally typed as `string` even though it may be undefined
// at runtime, because numerous consumers pass it directly into APIs that
// require a string (this matches the implicit-any behaviour the file had
// when it was JavaScript).
export interface NormalizedTxState {
  from: string;
  to?: string;
  value?: string;
  data?: string;
  gas?: string;
  gasPrice?: string;
  chainId?: string;
  nonce?: string;
  origin?: string;
  type?: string;
  [key: string]: unknown;
}

export function getNormalizedTxState(state: {
  transaction?: { transaction?: Record<string, unknown> } & Record<
    string,
    unknown
  >;
}): NormalizedTxState {
  return state.transaction
    ? ({
        ...state.transaction,
        ...state.transaction.transaction,
      } as NormalizedTxState)
    : ({} as NormalizedTxState);
}

interface BrowserTab {
  id: string | number;
  url: string;
}

export const getActiveTabUrl = ({
  browser = {},
}: {
  browser?: { tabs?: BrowserTab[]; activeTab?: string | number };
}): string =>
  (browser.tabs &&
    browser.activeTab &&
    browser.tabs.find(({ id }: BrowserTab) => id === browser.activeTab)?.url) ||
  '';

interface CalculateAmountsEIP1559Args {
  value: string;
  nativeCurrency: string;
  currentCurrency: string;
  conversionRate: number;
  gasFeeMinConversion: string | number;
  gasFeeMinNative: string | number;
  gasFeeMaxNative: string | number;
  gasFeeMaxConversion: string | number;
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
}: CalculateAmountsEIP1559Args) => {
  // amount numbers
  const amountConversion = getValueFromWeiHex({
    value,
    fromCurrency: nativeCurrency,
    toCurrency: currentCurrency,
    conversionRate,
    numberOfDecimals: 2,
  });
  const amountNative = getValueFromWeiHex({
    value,
    fromCurrency: nativeCurrency,
    toCurrency: nativeCurrency,
    conversionRate,
    numberOfDecimals: 6,
  });

  // Total numbers
  const totalMinNative = addEth(
    gasFeeMinNative,
    amountNative as string | number,
  );
  const totalMinConversion = addFiat(
    gasFeeMinConversion,
    amountConversion as string | number,
  );
  const totalMaxNative = addEth(
    gasFeeMaxNative,
    amountNative as string | number,
  );
  const totalMaxConversion = addFiat(
    gasFeeMaxConversion,
    amountConversion as string | number,
  );

  const totalMinHex = addCurrencies(gasFeeMinHex, value, {
    toNumericBase: 'hex',
    aBase: MULTIPLIER_HEX,
    bBase: MULTIPLIER_HEX,
  }) as string;

  const totalMaxHex = addCurrencies(gasFeeMaxHex, value, {
    toNumericBase: 'hex',
    aBase: MULTIPLIER_HEX,
    bBase: MULTIPLIER_HEX,
  }) as string;

  return {
    totalMinNative,
    totalMinConversion,
    totalMaxNative,
    totalMaxConversion,
    totalMinHex,
    totalMaxHex,
  };
};

interface CalculateEthEIP1559Args {
  nativeCurrency: string;
  currentCurrency: string;
  totalMinNative: string | number;
  totalMinConversion: string | number;
  totalMaxNative: string | number;
  totalMaxConversion: string | number;
}

export const calculateEthEIP1559 = ({
  nativeCurrency,
  currentCurrency,
  totalMinNative,
  totalMinConversion,
  totalMaxNative,
  totalMaxConversion,
}: CalculateEthEIP1559Args) => {
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

interface CalculateERC20EIP1559Args {
  currentCurrency: string;
  nativeCurrency: string;
  conversionRate: number;
  exchangeRate: number;
  tokenAmount: string;
  totalMinConversion: string | number;
  totalMaxConversion: string | number;
  symbol: string;
  totalMinNative: string | number;
  totalMaxNative: string | number;
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
}: CalculateERC20EIP1559Args) => {
  const tokenAmountConversion = convertTokenToFiat({
    value: tokenAmount,
    toCurrency: currentCurrency,
    conversionRate,
    contractExchangeRate: exchangeRate,
  });

  const tokenTotalMinConversion = roundExponential(
    addFiat(tokenAmountConversion as string | number, totalMinConversion),
  );
  const tokenTotalMaxConversion = roundExponential(
    addFiat(tokenAmountConversion as string | number, totalMaxConversion),
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

interface GasFeeEstimateLevel {
  maxWaitTimeEstimate?: number;
  minWaitTimeEstimate?: number;
  suggestedMaxPriorityFeePerGas?: string;
}

interface GasFeeEstimates {
  low?: GasFeeEstimateLevel;
  medium?: GasFeeEstimateLevel;
  high?: GasFeeEstimateLevel;
  [key: string]: unknown;
}

interface CalculateEIP1559TimesArgs {
  suggestedMaxPriorityFeePerGas?: string | number;
  suggestedMaxFeePerGas?: string | number;
  selectedOption?: string;
  recommended?: string;
  gasFeeEstimates?: GasFeeEstimates;
}

export const calculateEIP1559Times = ({
  suggestedMaxPriorityFeePerGas,
  suggestedMaxFeePerGas,
  selectedOption,
  recommended,
  gasFeeEstimates,
}: CalculateEIP1559TimesArgs): {
  timeEstimate: string;
  timeEstimateColor: string;
  timeEstimateId: string | undefined;
} => {
  let timeEstimate: string = strings('times_eip1559.unknown');
  let timeEstimateColor = 'grey';
  let timeEstimateId: string | undefined;

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
      gasFeeEstimates?.[LOW] &&
      gasFeeEstimates[MEDIUM] &&
      gasFeeEstimates[HIGH]
    ) {
      let hasTime = false;
      const lowLevel = gasFeeEstimates[LOW];
      const highLevel = gasFeeEstimates[HIGH];
      if (selectedOption === LOW && lowLevel?.maxWaitTimeEstimate) {
        timeEstimate = `${strings('times_eip1559.maybe')} ${humanizeDuration(
          lowLevel.maxWaitTimeEstimate,
          timeParams,
        )}`;
        timeEstimateId = AppConstants.GAS_TIMES.MAYBE;
        hasTime = true;
      } else if (
        selectedOption === MEDIUM &&
        lowLevel?.maxWaitTimeEstimate
      ) {
        timeEstimate = `${strings('times_eip1559.likely')} ${humanizeDuration(
          lowLevel.maxWaitTimeEstimate,
          timeParams,
        )}`;
        timeEstimateId = AppConstants.GAS_TIMES.LIKELY;
        hasTime = true;
      } else if (
        selectedOption === HIGH &&
        highLevel?.minWaitTimeEstimate
      ) {
        timeEstimate = `${strings(
          'times_eip1559.likely_in',
        )} ${humanizeDuration(
          highLevel.minWaitTimeEstimate,
          timeParams,
        )}`;
        timeEstimateId = AppConstants.GAS_TIMES.VERY_LIKELY;
        hasTime = true;
      }

      if (
        Number(suggestedMaxPriorityFeePerGas) >=
        Number(highLevel?.suggestedMaxPriorityFeePerGas)
      ) {
        timeEstimate = `${strings(
          'times_eip1559.likely_in',
        )} ${humanizeDuration(
          highLevel?.minWaitTimeEstimate ?? 0,
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
      suggestedMaxPriorityFeePerGas as string,
      suggestedMaxFeePerGas as string,
    ) as
      | string
      | { upperTimeBound: number | string; lowerTimeBound: number };

    if (
      !times ||
      times === 'unknown' ||
      Object.keys(times).length < 2 ||
      (typeof times === 'object' && times.upperTimeBound === 'unknown')
    ) {
      timeEstimate = strings('times_eip1559.unknown');
      timeEstimateId = AppConstants.GAS_TIMES.UNKNOWN;
      timeEstimateColor = 'red';
    } else if (typeof times === 'object' && selectedOption === LOW) {
      timeEstimate = `${strings('times_eip1559.maybe')} ${humanizeDuration(
        Number(times.upperTimeBound),
        timeParams,
      )}`;
      timeEstimateId = AppConstants.GAS_TIMES.MAYBE;
    } else if (typeof times === 'object' && selectedOption === MEDIUM) {
      timeEstimate = `${strings('times_eip1559.likely')} ${humanizeDuration(
        Number(times.upperTimeBound),
        timeParams,
      )}`;
      timeEstimateId = AppConstants.GAS_TIMES.LIKELY;
    } else if (typeof times === 'object' && selectedOption === HIGH) {
      timeEstimate = `${strings(
        'times_eip1559.very_likely',
      )} ${humanizeDuration(Number(times.upperTimeBound), timeParams)}`;
      timeEstimateId = AppConstants.GAS_TIMES.VERY_LIKELY;
    } else if (typeof times === 'object' && times.upperTimeBound === 0) {
      timeEstimate = `${strings('times_eip1559.at_least')} ${humanizeDuration(
        Number(times.lowerTimeBound),
        timeParams,
      )}`;
      timeEstimateColor = 'red';
      timeEstimateId = AppConstants.GAS_TIMES.AT_LEAST;
    } else if (typeof times === 'object' && times.lowerTimeBound === 0) {
      timeEstimate = `${strings('times_eip1559.less_than')} ${humanizeDuration(
        Number(times.upperTimeBound),
        timeParams,
      )}`;
      timeEstimateColor = 'green';
      timeEstimateId = AppConstants.GAS_TIMES.LESS_THAN;
    } else if (typeof times === 'object') {
      timeEstimate = `${humanizeDuration(
        Number(times.lowerTimeBound),
        timeParams,
      )} - ${humanizeDuration(Number(times.upperTimeBound), timeParams)}`;
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

interface CalculateEIP1559GasFeeHexesArgs {
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
}: CalculateEIP1559GasFeeHexesArgs) => {
  // Hex calculations
  const estimatedBaseFee_PLUS_suggestedMaxPriorityFeePerGasHex = addCurrencies(
    estimatedBaseFeeHex,
    suggestedMaxPriorityFeePerGasHex,
    {
      toNumericBase: 'hex',
      aBase: MULTIPLIER_HEX,
      bBase: MULTIPLIER_HEX,
    },
  ) as string;

  const maxPriorityFeePerGasTimesGasLimitHex = multiplyCurrencies(
    suggestedMaxPriorityFeePerGasHex,
    gasLimitHex,
    {
      toNumericBase: 'hex',
      multiplicandBase: MULTIPLIER_HEX,
      multiplierBase: MULTIPLIER_HEX,
    },
  ) as string;

  const gasFeeMinHex = multiplyCurrencies(
    estimatedBaseFee_PLUS_suggestedMaxPriorityFeePerGasHex,
    estimatedGasLimitHex || gasLimitHex,
    {
      toNumericBase: 'hex',
      multiplicandBase: MULTIPLIER_HEX,
      multiplierBase: MULTIPLIER_HEX,
    },
  ) as string;
  const gasFeeMaxHex = multiplyCurrencies(
    suggestedMaxFeePerGasHex,
    gasLimitHex,
    {
      toNumericBase: 'hex',
      multiplicandBase: MULTIPLIER_HEX,
      multiplierBase: MULTIPLIER_HEX,
    },
  ) as string;

  return {
    estimatedBaseFee_PLUS_suggestedMaxPriorityFeePerGasHex,
    maxPriorityFeePerGasTimesGasLimitHex,
    gasFeeMinHex,
    gasFeeMaxHex,
  };
};

interface SelectedGasFee {
  suggestedMaxPriorityFeePerGas?: string;
  suggestedMaxFeePerGas?: string;
  estimatedBaseFee?: string;
  suggestedGasLimit: string | number;
  suggestedEstimatedGasLimit?: string | number;
  suggestedGasPrice?: string;
  selectedOption?: string;
  recommended?: string;
}

interface SwapsParams {
  tradeValue: string;
  isNativeAsset: boolean;
  sourceAmount: string;
}

interface SelectedAssetInfo {
  isETH?: boolean;
  tokenId?: string;
  address?: string;
  symbol?: string;
  decimals?: number;
}

interface ParseTransactionEIP1559Args {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedGasFee: any;
  swapsParams?: SwapsParams;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contractExchangeRates: any;
  conversionRate: number;
  currentCurrency: string;
  nativeCurrency: string;
  transactionState?: {
    selectedAsset: SelectedAssetInfo;
    transaction: { value?: string; data?: string };
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gasFeeEstimates?: any;
}

export const parseTransactionEIP1559 = (
  {
    selectedGasFee: rawSelectedGasFee,
    swapsParams,
    contractExchangeRates,
    conversionRate,
    currentCurrency,
    nativeCurrency,
    transactionState: { selectedAsset, transaction: { value, data } } = {
      selectedAsset: {} as SelectedAssetInfo,
      transaction: {},
    },
    gasFeeEstimates: rawGasFeeEstimates,
  }: ParseTransactionEIP1559Args,
  { onlyGas }: { onlyGas?: boolean } = {},
) => {
  const selectedGasFee = rawSelectedGasFee as SelectedGasFee;
  const gasFeeEstimates = rawGasFeeEstimates as GasFeeEstimates | undefined;
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
  const gasLimitHex = BNToHex(
    new BN(String(selectedGasFee.suggestedGasLimit)) as unknown as BN4,
  );
  const estimatedGasLimitHex = selectedGasFee.suggestedEstimatedGasLimit
    ? BNToHex(
        new BN(String(selectedGasFee.suggestedEstimatedGasLimit)) as unknown as BN4,
      )
    : undefined;

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
      estimatedGasLimitHex,
      estimatedBaseFeeHex,
      suggestedMaxPriorityFeePerGasHex,
      suggestedMaxFeePerGasHex,
    });

  if (swapsParams) {
    const { tradeValue, isNativeAsset, sourceAmount } = swapsParams;
    gasFeeMinHex = addCurrencies(gasFeeMinHex, tradeValue, {
      toNumericBase: 'hex',
      aBase: MULTIPLIER_HEX,
      bBase: MULTIPLIER_HEX,
    }) as string;
    gasFeeMaxHex = addCurrencies(gasFeeMaxHex, tradeValue, {
      toNumericBase: 'hex',
      aBase: MULTIPLIER_HEX,
      bBase: MULTIPLIER_HEX,
    }) as string;

    if (isNativeAsset) {
      gasFeeMinHex = subtractCurrencies(gasFeeMinHex, sourceAmount, {
        toNumericBase: 'hex',
        aBase: MULTIPLIER_HEX,
        bBase: 10,
      }) as string;
      gasFeeMaxHex = subtractCurrencies(gasFeeMaxHex, sourceAmount, {
        toNumericBase: 'hex',
        aBase: MULTIPLIER_HEX,
        bBase: 10,
      }) as string;
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
  }) as string;

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
    const { address, symbol = 'ERC20', decimals } = selectedAsset;

    const decoded = decodeTransferData('transfer', data ?? '');
    const rawAmount = decoded?.[2] ?? '0';
    const rawAmountString = parseInt(rawAmount, 16).toLocaleString('fullwide', {
      useGrouping: false,
    });
    const tokenAmount = renderFromTokenMinimalUnit(
      rawAmountString,
      decimals ?? 0,
    );

    const exchangeRate = address
      ? (contractExchangeRates[address] as { price?: number } | undefined)?.price
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
      exchangeRate: exchangeRate ?? 0,
      tokenAmount: String(tokenAmount),
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

interface ParseTransactionLegacyArgs {
  contractExchangeRates: Record<string, { price?: number } | number | undefined>;
  conversionRate: number;
  currentCurrency: string;
  transactionState?: {
    selectedAsset: SelectedAssetInfo;
    transaction: { value?: string; data?: string };
  };
  ticker?: string;
  selectedGasFee: SelectedGasFee | string | Record<string, unknown>;
  multiLayerL1FeeTotal?: string;
}

type LegacyGasFee = SelectedGasFee;

export const parseTransactionLegacy = (
  {
    contractExchangeRates,
    conversionRate,
    currentCurrency,
    transactionState: { selectedAsset, transaction: { value, data } } = {
      selectedAsset: {} as SelectedAssetInfo,
      transaction: {},
    },
    ticker,
    selectedGasFee: rawSelectedGasFee,
    multiLayerL1FeeTotal,
  }: ParseTransactionLegacyArgs,
  { onlyGas }: { onlyGas?: boolean } = {},
) => {
  const selectedGasFee = rawSelectedGasFee as LegacyGasFee;
  const gasLimit = new BN(
    String(selectedGasFee.suggestedGasLimit),
  ) as unknown as BN4;
  const gasLimitHex = BNToHex(
    new BN(String(selectedGasFee.suggestedGasLimit)) as unknown as BN4,
  );

  let weiTransactionFee: BN4 | undefined =
    gasLimit &&
    (gasLimit.mul(
      hexToBN(decGWEIToHexWEI(selectedGasFee.suggestedGasPrice ?? '0')) as unknown as BN4,
    ) as unknown as BN4);
  if (multiLayerL1FeeTotal && weiTransactionFee) {
    weiTransactionFee = hexToBN(
      sumHexWEIs([BNToHex(weiTransactionFee), multiLayerL1FeeTotal]),
    ) as unknown as BN4;
  }

  const suggestedGasPriceHex = decGWEIToHexWEI(
    selectedGasFee.suggestedGasPrice ?? '0',
  );

  const valueBN = (
    value ? hexToBN(value) : hexToBN('0x0')
  ) as unknown as BN4;
  const transactionFeeFiat = weiToFiat(
    weiTransactionFee as unknown as BN4,
    conversionRate,
    currentCurrency,
  );
  const parsedTicker = getTicker(ticker);
  const transactionFee = `${renderFromWei(weiTransactionFee)} ${parsedTicker}`;

  const totalHex = valueBN.add(weiTransactionFee as unknown as BN4);

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

  let transactionTotalAmount: string | undefined;
  let transactionTotalAmountFiat: string | undefined;

  if (selectedAsset.isETH) {
    const transactionTotalAmountBN = weiTransactionFee?.add(valueBN);
    transactionTotalAmount = `${renderFromWei(
      transactionTotalAmountBN as unknown as BN4,
    )} ${parsedTicker}`;
    transactionTotalAmountFiat = weiToFiat(
      transactionTotalAmountBN as unknown as BN4,
      conversionRate,
      currentCurrency,
    );
  } else if (selectedAsset.tokenId) {
    const transactionTotalAmountBN = weiTransactionFee?.add(valueBN);
    transactionTotalAmount = `${renderFromWei(
      weiTransactionFee as unknown as BN4,
    )} ${parsedTicker}`;

    transactionTotalAmountFiat = weiToFiat(
      transactionTotalAmountBN as unknown as BN4,
      conversionRate,
      currentCurrency,
    );
  } else if (data) {
    const { address, symbol = 'ERC20', decimals } = selectedAsset;
    const decoded = decodeTransferData('transfer', data);
    const rawAmount = decoded?.[2] ?? '0';
    const rawAmountString = parseInt(rawAmount, 16).toLocaleString('fullwide', {
      useGrouping: false,
    });
    const transferValue = renderFromTokenMinimalUnit(
      rawAmountString,
      decimals ?? 0,
    );
    const transactionValue = `${transferValue} ${symbol}`;
    const exchangeRate = address
      ? (contractExchangeRates?.[address] as { price?: number } | undefined)?.price
      : undefined;
    const transactionFeeFiatNumber = weiToFiatNumber(
      weiTransactionFee,
      conversionRate,
    );

    const transactionValueFiatNumber = balanceToFiatNumber(
      transferValue as unknown as number,
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
interface ValidateTxArgs {
  transaction: {
    from?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    gas?: string;
    value?: string;
  };
}

export function validateTransactionActionBalance(
  transaction: ValidateTxArgs,
  rate: string | number,
  accounts: Record<string, { balance: string }>,
): boolean {
  try {
    const checksummedFrom = safeToChecksumAddress(
      transaction.transaction.from ?? '',
    ) as string;
    const balance = accounts[checksummedFrom].balance;

    let gasPrice = transaction.transaction.gasPrice;
    const transactionToCheck = transaction.transaction;

    if (isEIP1559Transaction(transactionToCheck as never)) {
      gasPrice = transactionToCheck.maxFeePerGas;
    }

    return (hexToBN(balance) as unknown as BN4).lt(
      (hexToBN(gasPrice ?? '0x0') as unknown as BN4)
        .mul(new BN(String(Number(rate) * 10)) as unknown as BN4)
        .div(new BN(10) as unknown as BN4)
        .mul(hexToBN(transaction.transaction.gas ?? '0x0') as unknown as BN4)
        .add(hexToBN(transaction.transaction.value ?? '0x0') as unknown as BN4),
    );
  } catch (e) {
    return false;
  }
}

/**
 * @param value - Number, string, or BigNumber value to convert.
 * @param decimals - Optional decimals to apply.
 * @returns BigNumber-divided amount.
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
  decimals?: number,
): BigNumber {
  const multiplier = Math.pow(10, Number(decimals || 0));
  return new BigNumber(String(value)).times(multiplier);
}

/**
 * Attempts to get the address parameter of the given token transaction data
 * (i.e. function call) per the Human Standard Token ABI, in the following
 * order: the '_to' parameter (if present) or the first parameter (if present).
 *
 * @param tokenData - ethers Interface token data.
 * @returns A lowercase address string, or undefined.
 */
interface TokenData {
  args?: {
    _to?: { toString(): string };
    _value?: { _hex?: string; toString(): string };
    [key: number]: { _hex?: string; toString(): string };
  };
}

export function getTokenAddressParam(
  tokenData: TokenData = {},
): string | undefined {
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
export function getTokenValueParamAsHex(
  tokenData: TokenData = {},
): string | undefined {
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
export function getTokenValueParam(
  tokenData: TokenData = {},
): string | undefined {
  return tokenData?.args?._value?.toString();
}

interface TokenParam {
  name: string;
  value: unknown;
}

export function getTokenValue(
  tokenParams: TokenParam[] = [],
): unknown | undefined {
  const valueData = tokenParams.find((param) => param.name === '_value');
  return valueData?.value;
}

/**
 * Generates a new transaction with the token allowance
 * @param {String | Object} tokenValue - value for the token allowance
 * @param {Number} tokenDecimals - Token decimal
 * @param {String} spenderAddress - Address to which the allowance will be granted
 * @param {Object} transaction - Transaction to update
 * @returns A new transaction object with the token allowance encoded
 */
export const generateTxWithNewTokenAllowance = (
  tokenValue: string | number | BN4,
  tokenDecimals: number,
  spenderAddress: string,
  transaction: { data?: string; [key: string]: unknown },
): { data: string; [key: string]: unknown } => {
  const uint = toTokenMinimalUnit(
    tokenValue as string | number,
    tokenDecimals,
  ) as unknown as BN4;
  const approvalData = generateApprovalData({
    spender: spenderAddress,
    value: uint.gt(UINT256_BN_MAX_VALUE as unknown as BN4)
      ? (UINT256_BN_MAX_VALUE as unknown as BN4).toString(16)
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
      (swapsUtils.isValidContractAddress(chainId as `0x${string}`, to) ||
        (data?.startsWith(APPROVE_FUNCTION_SIGNATURE) &&
          decodeApproveData(data).spenderAddress?.toLowerCase() ===
            swapsUtils.getSwapsContractAddress(chainId as `0x${string}`))),
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
    data && getFourByteSignature(data) === APPROVE_FUNCTION_SIGNATURE;
  const isSpenderSwapsContract =
    decodeApproveData(data).spenderAddress?.toLowerCase() ===
    swapsUtils.getSwapsContractAddress(chainId as `0x${string}`);

  return Boolean(
    isFromSwaps && to && isApproveFunction && isSpenderSwapsContract,
  );
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
export const getIsNativeTokenTransferred = (txParams: {
  value?: string;
}): boolean => txParams?.value !== '0x0';

/**
 * Checks if the given token standard is non-fungible (ERC721 or ERC1155).
 *
 * @param {string} tokenStandard - The token standard to check.
 * @returns {boolean} - True if the token standard is ERC721 or ERC1155, otherwise false.
 */
export function isNFTTokenStandard(tokenStandard: string): boolean {
  return ([ERC721, ERC1155] as string[]).includes(tokenStandard);
}

/**
 * Get a transaction by its ID
 * @param {string} transactionId - The ID of the transaction to get
 * @param {TransactionController} transactionController - The transaction controller
 * @returns {TransactionMeta} The transaction meta object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTransactionById<T extends { id: string } = any>(
  transactionId: string,
  transactionController: {
    state: { transactions: T[] };
  },
): T | undefined {
  return transactionController.state.transactions.find(
    (tx) => tx.id === transactionId,
  );
}
