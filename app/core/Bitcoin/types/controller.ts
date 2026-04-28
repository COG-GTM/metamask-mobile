/**
 * Bitcoin controller contract types.
 *
 * Defines the interfaces that Bitcoin-specific controllers must implement
 * to integrate with the MetaMask Engine's controller architecture.
 *
 * The current implementation delegates most Bitcoin logic to the
 * `@metamask/bitcoin-wallet-snap` via the Snap keyring. These contracts
 * formalize the boundary between the Snap and the host controllers,
 * and define the extension points for native Bitcoin support.
 */

import { CaipChainId } from '@metamask/utils';

import { BitcoinAccountData, BitcoinUtxo, BitcoinBalance } from './account';
import {
  BitcoinFeeRates,
  BitcoinTransaction,
  BitcoinTransactionParams,
  CoinSelectionResult,
  CoinSelectionStrategy,
} from './transaction';
import { BitcoinNetworkId } from './network';

// ---------------------------------------------------------------------------
// Bitcoin Account Service
// ---------------------------------------------------------------------------

/**
 * Contract for a service that manages Bitcoin account state.
 *
 * Responsibilities:
 * - Track addresses and derive new ones as needed (gap limit).
 * - Maintain the UTXO set for each account.
 * - Compute balances from UTXOs.
 *
 * In the current Snap-based architecture, the Snap handles address
 * derivation and the `MultichainBalancesController` aggregates balances.
 * This interface defines the contract for a future native implementation
 * or for code that wraps the Snap's responses.
 */
export interface BitcoinAccountService {
  /**
   * Retrieve Bitcoin-specific account data for an internal account.
   *
   * @param accountId - The `InternalAccount.id` from `AccountsController`.
   * @param networkId - Target Bitcoin network.
   * @returns The UTXO-based account data.
   */
  getAccountData(
    accountId: string,
    networkId: BitcoinNetworkId,
  ): Promise<BitcoinAccountData>;

  /**
   * Fetch and cache the UTXO set for an account from the network.
   *
   * @param accountId - The account identifier.
   * @param networkId - Target Bitcoin network.
   * @returns The refreshed UTXO list.
   */
  fetchUtxos(
    accountId: string,
    networkId: BitcoinNetworkId,
  ): Promise<BitcoinUtxo[]>;

  /**
   * Get the current balance (from cached UTXOs).
   *
   * @param accountId - The account identifier.
   * @param networkId - Target Bitcoin network.
   * @returns The aggregated balance.
   */
  getBalance(
    accountId: string,
    networkId: BitcoinNetworkId,
  ): Promise<BitcoinBalance>;

  /**
   * Derive the next unused receive address for an account.
   *
   * @param accountId - The account identifier.
   * @param networkId - Target Bitcoin network.
   * @returns The next receive address string.
   */
  getNextReceiveAddress(
    accountId: string,
    networkId: BitcoinNetworkId,
  ): Promise<string>;
}

// ---------------------------------------------------------------------------
// Bitcoin Transaction Service
// ---------------------------------------------------------------------------

/**
 * Contract for a service that builds, signs, and broadcasts
 * Bitcoin transactions.
 *
 * In the current Snap-based architecture, the send flow is initiated
 * via `sendMultichainTransaction()` which calls the Snap's
 * `startSendTransactionFlow` RPC method. This interface defines
 * the contract for more granular transaction control.
 */
export interface BitcoinTransactionService {
  /**
   * Fetch current fee rate estimates from the network.
   *
   * @param networkId - Target Bitcoin network.
   * @returns Tiered fee rate recommendations.
   */
  getFeeRates(networkId: BitcoinNetworkId): Promise<BitcoinFeeRates>;

  /**
   * Perform coin selection for a transaction.
   *
   * @param params - Transaction parameters.
   * @param utxos - Available UTXOs to select from.
   * @param strategy - Coin selection algorithm to use.
   * @returns Selected inputs, outputs, and computed fee.
   */
  selectCoins(
    params: BitcoinTransactionParams,
    utxos: BitcoinUtxo[],
    strategy: CoinSelectionStrategy,
  ): CoinSelectionResult;

  /**
   * Estimate the fee for a transaction given its parameters.
   *
   * @param params - Transaction parameters.
   * @param utxos - Available UTXOs.
   * @returns Estimated fee in satoshis.
   */
  estimateFee(
    params: BitcoinTransactionParams,
    utxos: BitcoinUtxo[],
  ): number;

  /**
   * Build an unsigned transaction.
   *
   * @param params - Transaction parameters.
   * @returns The constructed (unsigned) transaction.
   */
  buildTransaction(
    params: BitcoinTransactionParams,
  ): Promise<BitcoinTransaction>;

  /**
   * Sign a transaction using the keyring.
   *
   * @param transaction - The unsigned transaction.
   * @param accountId - The signing account's ID.
   * @returns The signed transaction with populated rawHex.
   */
  signTransaction(
    transaction: BitcoinTransaction,
    accountId: string,
  ): Promise<BitcoinTransaction>;

  /**
   * Broadcast a signed transaction to the Bitcoin network.
   *
   * @param transaction - The signed transaction.
   * @returns The broadcast transaction with txid populated.
   */
  broadcastTransaction(
    transaction: BitcoinTransaction,
  ): Promise<BitcoinTransaction>;

  /**
   * Get the current status of a transaction.
   *
   * @param txid - The transaction ID.
   * @param networkId - Target Bitcoin network.
   * @returns Updated transaction data.
   */
  getTransactionStatus(
    txid: string,
    networkId: BitcoinNetworkId,
  ): Promise<BitcoinTransaction>;
}

// ---------------------------------------------------------------------------
// Bitcoin Network Service
// ---------------------------------------------------------------------------

/**
 * Contract for a service that communicates with the Bitcoin network.
 *
 * This is the lowest-level abstraction that handles API calls to
 * Bitcoin full nodes or block explorer APIs (e.g. mempool.space,
 * Blockstream, Electrum).
 */
export interface BitcoinNetworkService {
  /**
   * Broadcast a raw transaction to the network.
   *
   * @param rawHex - Serialized transaction in hex.
   * @param networkId - Target Bitcoin network.
   * @returns The transaction ID returned by the node.
   */
  broadcastRawTransaction(
    rawHex: string,
    networkId: BitcoinNetworkId,
  ): Promise<string>;

  /**
   * Fetch UTXOs for a Bitcoin address.
   *
   * @param address - The Bitcoin address.
   * @param networkId - Target Bitcoin network.
   * @returns List of unspent outputs.
   */
  getUtxos(
    address: string,
    networkId: BitcoinNetworkId,
  ): Promise<BitcoinUtxo[]>;

  /**
   * Fetch the current recommended fee rates.
   *
   * @param networkId - Target Bitcoin network.
   * @returns Fee rate recommendations.
   */
  getFeeRates(networkId: BitcoinNetworkId): Promise<BitcoinFeeRates>;

  /**
   * Fetch transaction details by ID.
   *
   * @param txid - The transaction ID.
   * @param networkId - Target Bitcoin network.
   * @returns Raw transaction data.
   */
  getTransaction(
    txid: string,
    networkId: BitcoinNetworkId,
  ): Promise<BitcoinTransaction>;

  /**
   * Get the current block height of the network.
   *
   * @param networkId - Target Bitcoin network.
   * @returns The current block height.
   */
  getBlockHeight(networkId: BitcoinNetworkId): Promise<number>;
}

// ---------------------------------------------------------------------------
// Engine Integration
// ---------------------------------------------------------------------------

/**
 * Configuration for registering Bitcoin controllers with the Engine.
 *
 * This follows the same pattern as existing multichain controllers:
 * each controller is registered in the `CONTROLLER_MESSENGERS` map
 * and initialized via a `ControllerInitFunction`.
 *
 * @see {@link ../../Engine/types.ts} for `ControllerInitFunction`.
 */
export interface BitcoinControllerRegistration {
  /** The controller name as registered in `Controllers` type. */
  name: string;

  /** CAIP-2 scopes this controller handles. */
  supportedScopes: CaipChainId[];

  /**
   * Messenger actions this controller publishes.
   * Must be added to `GlobalActions` in `Engine/types.ts`.
   */
  publishedActions: string[];

  /**
   * Messenger events this controller publishes.
   * Must be added to `GlobalEvents` in `Engine/types.ts`.
   */
  publishedEvents: string[];

  /**
   * Actions from other controllers that this controller subscribes to.
   */
  allowedActions: string[];

  /**
   * Events from other controllers that this controller listens to.
   */
  allowedEvents: string[];
}
