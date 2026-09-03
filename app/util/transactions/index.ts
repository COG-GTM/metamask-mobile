import {
  addHexPrefix,
  toChecksumAddress,
  type BN as EthereumBN,
} from 'ethereumjs-util';
import BN from 'bnjs4';
import type BN5 from 'bnjs5';
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
  TransactionParams,
  TransactionMeta,
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

type StandardBN = BN5 | EthereumBN;

const { SAI_ADDRESS } = AppConstants;

interface LooseTransactionParams {
  from?: string;
  to?: string | null;
  data?: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: string;
  [key: string]: unknown;
}

interface TransactionRecord {
  txParams?: LooseTransactionParams;
  transaction?: LooseTransactionParams;
  type?: TransactionType;
  networkClientId?: string;
  toSmartContract?: boolean;
  isTransfer?: boolean;
  transferInformation?: {
    contractAddress: string;
    symbol: string;
  };
  time?: number;
}

interface TransferOptions {
  toAddress?: string;
  fromAddress?: string;
  amount?: string | number;
  tokenId?: string | number;
}

interface ApprovalOptions {
  spender?: string | null;
  value?: string;
  data?: string;
}

interface SelectedAsset {
  isETH?: boolean;
  tokenId?: string;
  address?: string;
  symbol?: string;
  decimals?: number;
}

interface SelectedGasFee {
  suggestedMaxPriorityFeePerGas?: string | number;
  suggestedMaxFeePerGas?: string | number;
  estimatedBaseFee?: string | number;
  suggestedGasLimit?: string | number;
  suggestedEstimatedGasLimit?: string | number;
  suggestedGasPrice?: string | number;
  selectedOption?: string | null;
  recommended?: string | null;
  minWaitTimeEstimate?: number;
  maxWaitTimeEstimate?: number;
}

interface GasFeeEstimate {
  minWaitTimeEstimate: number;
  maxWaitTimeEstimate: number;
  suggestedMaxPriorityFeePerGas: string | number;
}

interface GasFeeEstimates {
  low?: GasFeeEstimate;
  medium?: GasFeeEstimate;
  high?: GasFeeEstimate;
  [key: string]: unknown;
}

interface SwapsParams {
  tradeValue?: string;
  isNativeAsset?: boolean;
  sourceAmount?: string;
}

interface TransactionState {
  selectedAsset: SelectedAsset | string;
  transaction: LooseTransactionParams;
}

interface ContractExchangeRates {
  [address: string]: unknown;
}

interface AddressBook {
  [chainId: string]: {
    [address: string]: { name?: string };
  };
}

interface InternalAccountSummary {
  address: string;
  metadata: { name: string };
}

interface TokenArgument {
  _hex?: string;
  name?: string;
  value?: string;
  toString: () => string;
}

interface TokenData {
  args?: {
    _to?: TokenArgument;
    _value?: TokenArgument;
    [key: string]: TokenArgument | undefined;
  };
}

interface BrowserState {
  tabs?: { id: string; url?: string }[];
  activeTab?: string;
}

interface ParseTransactionInput {
  selectedGasFee: unknown;
  swapsParams?: SwapsParams;
  contractExchangeRates?: ContractExchangeRates;
  conversionRate?: number;
  currentCurrency?: string;
  nativeCurrency?: string;
  transactionState?: TransactionState;
  ticker?: string;
  multiLayerL1FeeTotal?: string;
  gasFeeEstimates?: unknown;
}

interface ParseOptions {
  onlyGas?: boolean;
}

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
  static cache = {};
}

/**
 * Object containing all known action keys, to be used in transaction review
 */
const reviewActionKeys = {
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
const actionKeys = {
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
export function generateTransferData(
  type: string | undefined = undefined,
  opts: TransferOptions = {},
) {
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
              [opts.toAddress, addHexPrefix(opts.amount as string)],
            ),
            (x) => ('00' + x.toString(16)).slice(-2),
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
                addHexPrefix(opts.tokenId as string),
              ],
            ),
            (x) => ('00' + x.toString(16)).slice(-2),
          )
          .join('')
      );
  }
}

/**
 * Extracts the four-byte signature from Ethereum transaction data.
 * @param {string | undefined} data The transaction data.
 * @returns {string | undefined} The four-byte signature if data is provided, otherwise undefined.
 */
export function getFourByteSignature(data?: string) {
  return data?.substring(0, 10);
}

/**
 * Checks if the transaction data corresponds to an "approve" or "increase allowance" function call.
 * @param {string} data The transaction data.
 * @returns {boolean} True if the transaction is an "approve" or "increase allowance" call, false otherwise.
 */
export function isApprovalTransaction(data: string) {
  const fourByteSignature = getFourByteSignature(data);
  return [
    APPROVE_FUNCTION_SIGNATURE,
    INCREASE_ALLOWANCE_SIGNATURE,
    SET_APPROVAL_FOR_ALL_SIGNATURE,
  ].includes(fourByteSignature as string);
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
export function generateApprovalData(opts: ApprovalOptions) {
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
        (x) => ('00' + x.toString(16)).slice(-2),
      )
      .join('')
  );
}

export function decodeApproveData(data: string) {
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
  type: 'transfer' | 'transferFrom',
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
          rawDecode(
            ['address'],
            bufferEncodedAddress as unknown as string,
          )[0] as string,
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
          rawDecode(
            ['address'],
            bufferEncodedFromAddress as unknown as string,
          )[0] as string,
        ),
        addHexPrefix(
          rawDecode(
            ['address'],
            bufferEncodedToAddress as unknown as string,
          )[0] as string,
        ),
        parseInt(encodedTokenId, 16).toString(),
      ];
    }
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
export async function getMethodData(data: string, networkClientId?: string) {
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
      fourByteSignature as string,
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
) {
  if (!address) return false;

  address = toChecksumAddress(address);

  // If in contract map we don't need to cache it
  if (
    isMainnetByChainId(chainId as `0x${string}`) &&
    (
      Engine.context.TokenListController.state
        .tokensChainsCache as Record<string, { data?: Record<string, unknown> }>
    )?.[chainId]
      ?.data?.[address]
  ) {
    return Promise.resolve(true);
  }

  const { NetworkController } = Engine.context;
  const finalNetworkClientId =
    networkClientId ??
    NetworkController.findNetworkClientIdByChainId(chainId as `0x${string}`);
  const ethQuery = new EthQuery(
    NetworkController.getNetworkClientById(finalNetworkClientId).provider,
  );

  const code = address
    ? await query(ethQuery, 'getCode', [address])
    : undefined;

  return isSmartContractCode(code) as boolean;
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
) {
  const cache = (CollectibleAddresses.cache as Record<string, boolean>)[
    address
  ];
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
  const isCollectible = ownerOf && ownerOf !== '0x';
  (CollectibleAddresses.cache as Record<string, boolean>)[address] =
    isCollectible as boolean;
  return isCollectible as boolean;
}

/**
 * Returns corresponding transaction action key
 *
 * @param {object} transaction - Transaction object
 * @param {string} chainId - Current chainId
 * @returns {string} - Corresponding transaction action key
 */
export async function getTransactionActionKey(
  transaction: TransactionRecord,
  chainId: string,
) {
  const { networkClientId, type } = transaction ?? {};
  const txParams = transaction.txParams ?? transaction.transaction ?? {};
  const { data, to } = txParams;

  if (
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
  tx: TransactionRecord,
  selectedAddress: string,
  ticker?: string,
  chainId?: string,
) {
  const actionKey = await getTransactionActionKey(tx, chainId as string);
  if (actionKey === SEND_ETHER_ACTION_KEY) {
    let currencySymbol = ticker;

    if (tx?.isTransfer) {
      // Third party sending wrong token symbol
      if (
    (tx.transferInformation as NonNullable<TransactionRecord['transferInformation']>)
      .contractAddress === SAI_ADDRESS.toLowerCase()
      ) {
        (tx.transferInformation as NonNullable<
          TransactionRecord['transferInformation']
        >).symbol = 'SAI';
      }
      currencySymbol = (
        tx.transferInformation as NonNullable<
          TransactionRecord['transferInformation']
        >
      ).symbol;
    }

    const incoming =
      safeToChecksumAddress(
        (tx.txParams as LooseTransactionParams).to as string,
      ) === selectedAddress;
    const selfSent =
      incoming &&
      safeToChecksumAddress(
        (tx.txParams as LooseTransactionParams).from as string,
      ) === selectedAddress;
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
  const transactionActionKey =
    actionKeys[actionKey as keyof typeof actionKeys];

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
  transaction: TransactionRecord,
  chainId: string,
) {
  const actionKey = await getTransactionActionKey(transaction, chainId);
  const transactionReviewActionKey =
    reviewActionKeys[actionKey as keyof typeof reviewActionKeys];
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
export function getTicker(ticker?: string) {
  return ticker || strings('unit.eth');
}

/**
 * Construct ETH asset object
 *
 * @param {string} ticker - Ticker
 * @returns {object} - ETH object
 */
export function getEther(ticker?: string) {
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
export function getTransactionToName({
  addressBook,
  chainId,
  toAddress,
  internalAccounts,
  ensRecipient,
}: {
  addressBook: AddressBook;
  chainId: string;
  toAddress: string;
  internalAccounts: InternalAccountSummary[];
  ensRecipient?: string;
}) {
  if (ensRecipient) {
    return ensRecipient;
  }

  const networkAddressBook = addressBook[chainId];
  const checksummedToAddress = toChecksumAddress(toAddress);

  // Convert internalAccounts array to a map for quick lookup
  const internalAccountsMap = internalAccounts.reduce<
    Record<string, InternalAccountSummary>
  >((acc, account) => {
    acc[toChecksumAddress(account.address)] = account;
    return acc;
  }, {});

  const matchingAccount = internalAccountsMap[checksummedToAddress];

  const transactionToName =
    (networkAddressBook
      ? networkAddressBook[checksummedToAddress]
        ? networkAddressBook[checksummedToAddress].name
        : networkAddressBook[checksummedToAddress]
      : networkAddressBook) ||
    (matchingAccount ? matchingAccount.metadata.name : matchingAccount);

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
) {
  return (
    transaction.time <= addedAccountTime && !accountAddedTimeInsertPointFound
  );
}

//Leaving here a comment to re-visit this function since it's probably be possible to deprecate
export function getNormalizedTxState(state: {
  transaction?: TransactionRecord & { transaction?: TransactionParams };
}): LooseTransactionParams & { from: string } {
  return state.transaction
    ? ({ ...state.transaction, ...state.transaction.transaction } as LooseTransactionParams & {
        from: string;
      })
    : (undefined as unknown as LooseTransactionParams & { from: string });
}

export const getActiveTabUrl = ({
  browser = {},
}: {
  browser?: BrowserState;
}) =>
  browser.tabs &&
  browser.activeTab &&
  browser.tabs.find(({ id }) => id === browser.activeTab)?.url;

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
}: {
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
}) => {
  // amount numbers
  const amountConversion = getValueFromWeiHex({
    value,
    fromCurrency: nativeCurrency,
    toCurrency: currentCurrency,
    conversionRate,
    numberOfDecimals: 2,
  } as unknown as Parameters<typeof getValueFromWeiHex>[0]);
  const amountNative = getValueFromWeiHex({
    value,
    fromCurrency: nativeCurrency,
    toCurrency: nativeCurrency,
    conversionRate,
    numberOfDecimals: 6,
  } as unknown as Parameters<typeof getValueFromWeiHex>[0]);

  // Total numbers
  const totalMinNative = addEth(
    gasFeeMinNative,
    amountNative as string,
  );
  const totalMinConversion = addFiat(
    gasFeeMinConversion,
    amountConversion as string,
  );
  const totalMaxNative = addEth(
    gasFeeMaxNative,
    amountNative as string,
  );
  const totalMaxConversion = addFiat(
    gasFeeMaxConversion,
    amountConversion as string,
  );

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

export const calculateEthEIP1559 = ({
  nativeCurrency,
  currentCurrency,
  totalMinNative,
  totalMinConversion,
  totalMaxNative,
  totalMaxConversion,
}: {
  nativeCurrency: string;
  currentCurrency: string;
  totalMinNative: string;
  totalMinConversion: string;
  totalMaxNative: string;
  totalMaxConversion: string;
}) => {
  const renderableTotalMinNative = formatETHFee(totalMinNative, nativeCurrency);
  const renderableTotalMinConversion = formatCurrency(
    totalMinConversion,
    currentCurrency as string,
  );

  const renderableTotalMaxNative = formatETHFee(totalMaxNative, nativeCurrency);
  const renderableTotalMaxConversion = formatCurrency(
    totalMaxConversion,
    currentCurrency as string,
  );
  return [
    renderableTotalMinNative,
    renderableTotalMinConversion,
    renderableTotalMaxNative,
    renderableTotalMaxConversion,
  ];
};

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
}: {
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
}) => {
  const tokenAmountConversion = convertTokenToFiat({
    value: tokenAmount,
    toCurrency: currentCurrency,
    conversionRate,
    contractExchangeRate: exchangeRate,
  });

  const tokenTotalMinConversion = roundExponential(
    addFiat(tokenAmountConversion as string, totalMinConversion),
  );
  const tokenTotalMaxConversion = roundExponential(
    addFiat(tokenAmountConversion as string, totalMaxConversion),
  );

  const renderableTotalMinConversion = formatCurrency(
    tokenTotalMinConversion,
    currentCurrency as string,
  );
  const renderableTotalMaxConversion = formatCurrency(
    tokenTotalMaxConversion,
    currentCurrency as string,
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

export const calculateEIP1559Times = ({
  suggestedMaxPriorityFeePerGas,
  suggestedMaxFeePerGas,
  selectedOption,
  recommended,
  gasFeeEstimates,
}: {
  suggestedMaxPriorityFeePerGas: string | number;
  suggestedMaxFeePerGas: string | number;
  selectedOption?: string | null;
  recommended?: string | null;
  gasFeeEstimates?: GasFeeEstimates;
}) => {
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
      (gasFeeEstimates[LOW] as GasFeeEstimate) &&
      (gasFeeEstimates[MEDIUM] as GasFeeEstimate) &&
      (gasFeeEstimates[HIGH] as GasFeeEstimate)
    ) {
      let hasTime = false;
      if (
        selectedOption === LOW &&
        (gasFeeEstimates[LOW] as GasFeeEstimate).maxWaitTimeEstimate
      ) {
        timeEstimate = `${strings('times_eip1559.maybe')} ${humanizeDuration(
          (gasFeeEstimates[LOW] as GasFeeEstimate).maxWaitTimeEstimate,
          timeParams,
        )}`;
        timeEstimateId = AppConstants.GAS_TIMES.MAYBE;
        hasTime = true;
      } else if (
        selectedOption === MEDIUM &&
        (gasFeeEstimates[LOW] as GasFeeEstimate).maxWaitTimeEstimate
      ) {
        timeEstimate = `${strings('times_eip1559.likely')} ${humanizeDuration(
          (gasFeeEstimates[LOW] as GasFeeEstimate).maxWaitTimeEstimate,
          timeParams,
        )}`;
        timeEstimateId = AppConstants.GAS_TIMES.LIKELY;
        hasTime = true;
      } else if (
        selectedOption === HIGH &&
        (gasFeeEstimates[HIGH] as GasFeeEstimate).minWaitTimeEstimate
      ) {
        timeEstimate = `${strings(
          'times_eip1559.likely_in',
        )} ${humanizeDuration(
          (gasFeeEstimates[HIGH] as GasFeeEstimate).minWaitTimeEstimate as number,
          timeParams,
        )}`;
        timeEstimateId = AppConstants.GAS_TIMES.VERY_LIKELY;
        hasTime = true;
      }

      if (
        Number(suggestedMaxPriorityFeePerGas) >=
        Number(
          (gasFeeEstimates[HIGH] as GasFeeEstimate)
            .suggestedMaxPriorityFeePerGas,
        )
      ) {
        timeEstimate = `${strings(
          'times_eip1559.likely_in',
        )} ${humanizeDuration(
          (gasFeeEstimates[HIGH] as GasFeeEstimate).minWaitTimeEstimate,
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
      | {
          upperTimeBound: number | 'unknown';
          lowerTimeBound: number | null;
        }
      | 'unknown'
      | undefined;

    if (
      !times ||
      times === 'unknown' ||
      Object.keys(times).length < 2 ||
      times.upperTimeBound === 'unknown'
    ) {
      timeEstimate = strings('times_eip1559.unknown');
      timeEstimateId = AppConstants.GAS_TIMES.UNKNOWN;
      timeEstimateColor = 'red';
    } else if (selectedOption === LOW) {
      timeEstimate = `${strings('times_eip1559.maybe')} ${humanizeDuration(
        times.upperTimeBound as number,
        timeParams,
      )}`;
      timeEstimateId = AppConstants.GAS_TIMES.MAYBE;
    } else if (selectedOption === MEDIUM) {
      timeEstimate = `${strings('times_eip1559.likely')} ${humanizeDuration(
        times.upperTimeBound as number,
        timeParams,
      )}`;
      timeEstimateId = AppConstants.GAS_TIMES.LIKELY;
    } else if (selectedOption === HIGH) {
      timeEstimate = `${strings(
        'times_eip1559.very_likely',
      )} ${humanizeDuration(times.upperTimeBound as number, timeParams)}`;
      timeEstimateId = AppConstants.GAS_TIMES.VERY_LIKELY;
    } else if (times.upperTimeBound === 0) {
      timeEstimate = `${strings('times_eip1559.at_least')} ${humanizeDuration(
        times.lowerTimeBound as number,
        timeParams,
      )}`;
      timeEstimateColor = 'red';
      timeEstimateId = AppConstants.GAS_TIMES.AT_LEAST;
    } else if (times.lowerTimeBound === 0) {
      timeEstimate = `${strings('times_eip1559.less_than')} ${humanizeDuration(
        times.upperTimeBound as number,
        timeParams,
      )}`;
      timeEstimateColor = 'green';
      timeEstimateId = AppConstants.GAS_TIMES.LESS_THAN;
    } else {
      timeEstimate = `${humanizeDuration(
        times.lowerTimeBound as number,
        timeParams,
      )} - ${humanizeDuration(times.upperTimeBound as number, timeParams)}`;
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

export const calculateEIP1559GasFeeHexes = ({
  gasLimitHex,
  estimatedGasLimitHex,
  estimatedBaseFeeHex,
  suggestedMaxFeePerGasHex,
  suggestedMaxPriorityFeePerGasHex,
}: {
  gasLimitHex: string;
  estimatedGasLimitHex?: string;
  estimatedBaseFeeHex: string;
  suggestedMaxFeePerGasHex: string;
  suggestedMaxPriorityFeePerGasHex: string;
}) => {
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

export const parseTransactionEIP1559 = (
  {
    selectedGasFee: selectedGasFeeInput,
    swapsParams,
    contractExchangeRates,
    conversionRate,
    currentCurrency,
    nativeCurrency,
    transactionState: {
      selectedAsset: selectedAssetOption,
      transaction: { value, data },
    } = {
      selectedAsset: {},
      transaction: {},
    },
    gasFeeEstimates: gasFeeEstimatesInput,
  }: ParseTransactionInput,
  { onlyGas }: ParseOptions = {},
) => {
  const gasFeeEstimates = gasFeeEstimatesInput as GasFeeEstimates | undefined;
  const selectedAsset = selectedAssetOption as SelectedAsset;
  const selectedGasFee = selectedGasFeeInput as SelectedGasFee;
  value = value || '0x0';

  const suggestedMaxPriorityFeePerGas = String(
    selectedGasFee.suggestedMaxPriorityFeePerGas,
  );
  const suggestedMaxFeePerGas = String(selectedGasFee.suggestedMaxFeePerGas);
  const estimatedBaseFee = selectedGasFee.estimatedBaseFee || '0';

  // Convert to hex
  const estimatedBaseFeeHex = decGWEIToHexWEI(estimatedBaseFee as string);
  const suggestedMaxPriorityFeePerGasHex = decGWEIToHexWEI(
    suggestedMaxPriorityFeePerGas,
  );
  const suggestedMaxFeePerGasHex = decGWEIToHexWEI(suggestedMaxFeePerGas);
  const gasLimitHex = BNToHex(
    new BN(selectedGasFee.suggestedGasLimit as string | number),
  );
  const estimatedGasLimitHex = (
    selectedGasFee.suggestedEstimatedGasLimit &&
    BNToHex(
      new BN(selectedGasFee.suggestedEstimatedGasLimit as string | number),
    )
  ) as string | undefined;

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
      estimatedBaseFeeHex: estimatedBaseFeeHex as string,
      suggestedMaxPriorityFeePerGasHex: suggestedMaxPriorityFeePerGasHex as string,
      suggestedMaxFeePerGasHex: suggestedMaxFeePerGasHex as string,
    });

  if (swapsParams) {
    const { tradeValue, isNativeAsset, sourceAmount } = swapsParams;
    gasFeeMinHex = addCurrencies(gasFeeMinHex, tradeValue as string, {
      toNumericBase: 'hex',
      aBase: MULTIPLIER_HEX,
      bBase: MULTIPLIER_HEX,
    });
    gasFeeMaxHex = addCurrencies(gasFeeMaxHex, tradeValue as string, {
      toNumericBase: 'hex',
      aBase: MULTIPLIER_HEX,
      bBase: MULTIPLIER_HEX,
    });

    if (isNativeAsset) {
      gasFeeMinHex = subtractCurrencies(gasFeeMinHex, sourceAmount as string, {
        toNumericBase: 'hex',
        aBase: MULTIPLIER_HEX,
        bBase: 10,
      });
      gasFeeMaxHex = subtractCurrencies(gasFeeMaxHex, sourceAmount as string, {
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
    currentCurrency as string,
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
    currentCurrency as string,
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
    currentCurrency as string,
  );
  const renderableGasFeeMaxNative = formatETHFee(
    gasFeeMaxNative,
    nativeCurrency,
    Boolean(gasFeeMaxHex) && gasFeeMaxHex !== '0x0',
  );
  const renderableGasFeeMaxConversion = formatCurrency(
    gasFeeMaxConversion,
    currentCurrency as string,
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
    nativeCurrency: nativeCurrency as string,
    currentCurrency: currentCurrency as string,
    conversionRate: conversionRate as number,
    gasFeeMinConversion: gasFeeMinConversion as string,
    gasFeeMinNative: gasFeeMinNative as string,
    gasFeeMaxNative: gasFeeMaxNative as string,
    gasFeeMaxConversion: gasFeeMaxConversion as string,
    gasFeeMaxHex: gasFeeMaxHex as string,
    gasFeeMinHex: gasFeeMinHex as string,
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
      nativeCurrency: nativeCurrency as string,
      currentCurrency: currentCurrency as string,
      totalMinNative: totalMinNative as string,
      totalMinConversion: totalMinConversion as string,
      totalMaxNative: totalMaxNative as string,
      totalMaxConversion: totalMaxConversion as string,
    });
  } else {
    const { address, symbol = 'ERC20', decimals } = selectedAsset;

    const [, , rawAmount] = decodeTransferData('transfer', data as string) as [
      string,
      string,
      string,
    ];
    const rawAmountString = parseInt(rawAmount as string, 16).toLocaleString(
      'fullwide',
      {
      useGrouping: false,
      },
    );
    const tokenAmount = renderFromTokenMinimalUnit(
      rawAmountString,
      decimals as number,
    );

    const exchangeRate = (
      (contractExchangeRates as ContractExchangeRates)[address as string] as
        | { price?: number }
        | undefined
    )?.price;

    [
      renderableTotalMinNative,
      renderableTotalMinConversion,
      renderableTotalMaxNative,
      renderableTotalMaxConversion,
    ] = calculateERC20EIP1559({
      currentCurrency: currentCurrency as string,
      nativeCurrency: nativeCurrency as string,
      conversionRate: conversionRate as number,
      exchangeRate,
      tokenAmount,
      totalMinConversion: totalMinConversion as string,
      totalMaxConversion: totalMaxConversion as string,
      symbol,
      totalMinNative: totalMinNative as string,
      totalMaxNative: totalMaxNative as string,
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

export const parseTransactionLegacy = (
  {
    contractExchangeRates,
    conversionRate,
    currentCurrency,
    transactionState: {
      selectedAsset: selectedAssetOption,
      transaction: { value, data },
    } = {
      selectedAsset: '',
      transaction: {},
    },
    ticker,
    selectedGasFee: selectedGasFeeInput,
    multiLayerL1FeeTotal,
  }: ParseTransactionInput,
  { onlyGas }: ParseOptions = {},
) => {
  const selectedAsset = selectedAssetOption as SelectedAsset;
  const selectedGasFee = selectedGasFeeInput as SelectedGasFee;
  const gasLimit = new BN(selectedGasFee.suggestedGasLimit as string | number);
  const gasLimitHex = BNToHex(
    new BN(selectedGasFee.suggestedGasLimit as string | number),
  );

  let weiTransactionFee = gasLimit
    ? gasLimit.mul(
        hexToBN(
          decGWEIToHexWEI(selectedGasFee.suggestedGasPrice as string),
        ),
      )
    : gasLimit;
  if (multiLayerL1FeeTotal) {
    weiTransactionFee = hexToBN(
      sumHexWEIs([BNToHex(weiTransactionFee), multiLayerL1FeeTotal]),
    );
  }

  const suggestedGasPriceHex = decGWEIToHexWEI(
    selectedGasFee.suggestedGasPrice as string,
  );

  const valueBN = value ? hexToBN(value) : hexToBN('0x0');
  const transactionFeeFiat = weiToFiat(
    weiTransactionFee,
    conversionRate as number,
    currentCurrency as string,
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
    const transactionTotalAmountBN = weiTransactionFee
      ? weiTransactionFee.add(valueBN)
      : weiTransactionFee;
    transactionTotalAmount = `${renderFromWei(
      transactionTotalAmountBN,
    )} ${parsedTicker}`;
    transactionTotalAmountFiat = weiToFiat(
      transactionTotalAmountBN,
      conversionRate as number,
      currentCurrency as string,
    );
  } else if (selectedAsset.tokenId) {
    const transactionTotalAmountBN = weiTransactionFee
      ? weiTransactionFee.add(valueBN)
      : weiTransactionFee;
    transactionTotalAmount = `${renderFromWei(
      weiTransactionFee,
    )} ${parsedTicker}`;

    transactionTotalAmountFiat = weiToFiat(
      transactionTotalAmountBN,
      conversionRate,
      currentCurrency as string,
    );
  } else if (data) {
    const { address, symbol = 'ERC20', decimals } = selectedAsset;
    const [, , rawAmount] = decodeTransferData('transfer', data as string) as [
      string,
      string,
      string,
    ];
    const rawAmountString = parseInt(rawAmount as string, 16).toLocaleString(
      'fullwide',
      {
      useGrouping: false,
      },
    );
    const transferValue = renderFromTokenMinimalUnit(
      rawAmountString,
      decimals as number,
    );
    const transactionValue = `${transferValue} ${symbol}`;
    const exchangeRate = (
      contractExchangeRates?.[address as string] as
        | { price?: number }
        | undefined
    )?.price;
    const transactionFeeFiatNumber = weiToFiatNumber(
      weiTransactionFee,
      conversionRate as number,
    );

    const transactionValueFiatNumber = balanceToFiatNumber(
      transferValue as string,
      conversionRate as number,
      exchangeRate as number,
    );
    transactionTotalAmount = `${transactionValue} + ${renderFromWei(
      weiTransactionFee,
    )} ${parsedTicker}`;
    transactionTotalAmountFiat = renderFiatAddition(
      transactionValueFiatNumber as number,
      transactionFeeFiatNumber as number,
      currentCurrency as string,
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
export function validateTransactionActionBalance(
  transaction: { transaction: LooseTransactionParams },
  rate: string | number,
  accounts: Record<string, { balance: string }>,
) {
  try {
    const checksummedFrom = safeToChecksumAddress(
      transaction.transaction.from as string,
    );
    const balance = accounts[checksummedFrom as string].balance;

    let gasPrice = transaction.transaction.gasPrice;
    const transactionToCheck = transaction.transaction;

    if (isEIP1559Transaction(transactionToCheck as TransactionParams)) {
      gasPrice = transactionToCheck.maxFeePerGas;
    }

    return hexToBN(balance as string).lt(
      hexToBN(gasPrice)
        .mul(new BN((rate as unknown as number) * 10))
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
 * @param {number} [decimals]
 * @returns {BigNumber}
 */
export function calcTokenAmount(
  value: string | number | BigNumber,
  decimals?: number,
) {
  const divisor = new BigNumber(10).pow(decimals ?? 0);
  return new BigNumber(String(value)).div(divisor);
}

export function calcTokenValue(
  value: string | number | BigNumber,
  decimals?: number,
) {
  const multiplier = Math.pow(10, Number(decimals || 0));
  return new BigNumber(String(value)).times(multiplier);
}

/**
 * Attempts to get the address parameter of the given token transaction data
 * (i.e. function call) per the Human Standard Token ABI, in the following
 * order:
 * - The '_to' parameter, if present
 * - The first parameter, if present
 *
 * @param {Object} tokenData - ethers Interface token data.
 * @returns {string | undefined} A lowercase address string.
 */
export function getTokenAddressParam(tokenData: TokenData = {}) {
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
export function getTokenValueParamAsHex(tokenData: TokenData = {}) {
  const value =
    tokenData?.args?._value?._hex ||
    (tokenData?.args?.[1] as TokenArgument | undefined)?._hex;
  return value?.toLowerCase();
}

/**
 * Gets the '_value' parameter of the given token transaction data
 * (i.e function call) per the Human Standard Token ABI, if present.
 *
 * @param {Object} tokenData - ethers Interface token data.
 * @returns {string | undefined} A decimal string value.
 */
export function getTokenValueParam(tokenData: TokenData = {}) {
  return tokenData?.args?._value?.toString();
}

export function getTokenValue(tokenParams: TokenArgument[] = []) {
  const valueData = tokenParams.find((param) => param.name === '_value');
  return valueData ? valueData.value : valueData;
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
  tokenValue: string | number | BN | StandardBN | BigNumber,
  tokenDecimals: number,
  spenderAddress: string,
  transaction: LooseTransactionParams,
) => {
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
export const minimumTokenAllowance = (tokenDecimals: number) => {
  if (tokenDecimals < 0) {
    throw new Error(NEGATIVE_TOKEN_DECIMALS);
  }
  return (
    Math.pow(10, -1 * tokenDecimals).toFixed(tokenDecimals) as unknown as {
      toString(radix?: number): string;
    }
  ).toString(10);
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
  return ((
    origin === process.env.MM_FOX_CODE &&
    to &&
    (swapsUtils.isValidContractAddress(chainId as `0x${string}`, to) ||
      (data?.startsWith(APPROVE_FUNCTION_SIGNATURE) &&
        decodeApproveData(data).spenderAddress?.toLowerCase() ===
        swapsUtils.getSwapsContractAddress(chainId as `0x${string}`)))
  ) as unknown) as boolean;
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

  return (isFromSwaps && to && isApproveFunction && isSpenderSwapsContract as unknown) as boolean;
};

/**
 * For a MM Swap tx: Determines if the transaction is the actual swap tx where tokens are transferred
 */
export const getIsSwapTransaction = (
  data: string | undefined,
  origin: string | undefined,
  to: string | undefined,
  chainId: string,
) => {
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
export const getIsNativeTokenTransferred = (
  txParams?: LooseTransactionParams,
) =>
  txParams?.value !== '0x0';

/**
 * Checks if the given token standard is non-fungible (ERC721 or ERC1155).
 *
 * @param {string} tokenStandard - The token standard to check.
 * @returns {boolean} - True if the token standard is ERC721 or ERC1155, otherwise false.
 */
export function isNFTTokenStandard(tokenStandard: string) {
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
  transactionController: {
    state: { transactions: { id: string; [key: string]: unknown }[] };
  },
): TransactionMeta | undefined {
  return transactionController.state.transactions.find(
    (tx) => tx.id === transactionId,
  ) as unknown as TransactionMeta | undefined;
}
