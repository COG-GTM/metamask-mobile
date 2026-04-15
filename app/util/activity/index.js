import { safeToChecksumAddress } from '../../util/address';
import { toLowerCaseEquals } from '../../util/general';
import { TX_UNAPPROVED } from '../../constants/transaction';

/**
 * Determines if the transaction is from or to the current wallet
 * @param from Transaction sender address
 * @param to Transaction receiver address
 * @param selectedAddress Current wallet address
 * @returns Boolean indicating if the current address is the sender or receiver
 */
export const isFromOrToSelectedAddress = (
from,
to,
selectedAddress) =>

toLowerCaseEquals(safeToChecksumAddress(from), selectedAddress) ||
toLowerCaseEquals(safeToChecksumAddress(to), selectedAddress);

/**
 * Determines if a transaction was executed in the current chain/network
 * @param tx - Transaction to evaluate
 * @param networkId - Current network id
 * @param chainId - Current chain id
 * @returns Boolean indicating if the transaction was executed in current chain
 */
export const isFromCurrentChain = (


tx,
networkId,
chainId) =>

chainId === tx.chainId || !tx.chainId && networkId === tx.networkID;

/**
 * Sorts an array of transaction based on the timestamp
 * @param transactions Array of transactions
 * @returns Sorted array
 */
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sortTransactions = (transactions) =>
[...transactions].sort((a, b) => {
  if (a.time > b.time) return -1;
  if (a.time < b.time) return 1;
  return 0;
});

/**
 * Filter based on the following conditions:
 * 1. The transaction is from/to the current address
 * 2. The transaction was executed in the current chain
 * 3. The status of the transaction is different to 'unapproved'
 * 4. If the transaction is a token transfer, the user must have that token in the wallet
 * @param tx - Transaction to evaluate
 * @param tokens - Arrays of tokens
 * @param selectedAddress - Current wallet address
 * @param networkId - Current network ID
 * @param chainId - Current chain ID
 * @returns A boolean indicating if the transaction meets the conditions
 */
export const filterByAddressAndNetwork = (


tx,


tokens,
selectedAddress,
networkId,
chainId,
tokenNetworkFilter) =>
{
  const {
    txParams: { from, to },
    isTransfer,
    transferInformation
  } = tx;

  const condition =
  Object.keys(tokenNetworkFilter).length === 1 ?
  isFromCurrentChain(tx, networkId, chainId) :
  true;

  if (
  isFromOrToSelectedAddress(from, to, selectedAddress) &&
  condition &&
  tx.status !== TX_UNAPPROVED)
  {
    return isTransfer ?
    !!tokens.find(({ address }) =>
    toLowerCaseEquals(address, transferInformation.contractAddress)
    ) :
    true;
  }

  return false;
};