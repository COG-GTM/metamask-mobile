/**
 * Bitcoin account model types.
 *
 * Bitcoin uses a UTXO (Unspent Transaction Output) model, which is
 * fundamentally different from Ethereum's account-based model. A Bitcoin
 * "account" is a collection of addresses derived from a single HD key path,
 * and its "balance" is the sum of all unspent outputs across those addresses.
 *
 * These types extend the MetaMask `InternalAccount` abstraction to carry
 * Bitcoin-specific data that controllers and UI components need.
 */

import { BitcoinAddress, BitcoinAddressType } from './address';
import { BitcoinNetworkId } from './network';

/**
 * A single unspent transaction output (UTXO).
 *
 * This is the fundamental unit of Bitcoin value. UTXOs are consumed
 * as inputs when creating new transactions and new UTXOs are created
 * as outputs.
 */
export interface BitcoinUtxo {
  /** Transaction ID that created this output. */
  txid: string;

  /** Output index within the transaction (vout). */
  vout: number;

  /** Value in satoshis (1 BTC = 100,000,000 satoshis). */
  value: number;

  /** The scriptPubKey (locking script) as hex. */
  scriptPubKey: string;

  /** The address that owns this UTXO. */
  address: string;

  /** Address type for fee estimation during coin selection. */
  addressType: BitcoinAddressType;

  /** BIP32 derivation path for signing. */
  derivationPath: string;

  /** Number of confirmations. 0 = unconfirmed / in mempool. */
  confirmations: number;

  /** Block height at which this UTXO was confirmed. Undefined if unconfirmed. */
  blockHeight?: number;
}

/**
 * Aggregated balance information for a Bitcoin account.
 */
export interface BitcoinBalance {
  /** Confirmed balance in satoshis. */
  confirmed: number;

  /** Unconfirmed (mempool) balance in satoshis. */
  unconfirmed: number;

  /** Total = confirmed + unconfirmed, in satoshis. */
  total: number;
}

/**
 * Bitcoin-specific account data that supplements the base `InternalAccount`.
 *
 * The `InternalAccount` from `@metamask/keyring-internal-api` provides the
 * canonical account identity (id, address, type, metadata). This interface
 * adds the UTXO-model data that Bitcoin needs.
 */
export interface BitcoinAccountData {
  /** The CAIP-2 network this account data belongs to. */
  networkId: BitcoinNetworkId;

  /** Primary receive address (the one shown to the user). */
  receiveAddress: BitcoinAddress;

  /** All known addresses derived for this account (receive + change). */
  addresses: BitcoinAddress[];

  /** Current UTXO set for this account. */
  utxos: BitcoinUtxo[];

  /** Aggregated balance. */
  balance: BitcoinBalance;

  /** Next unused receive address index (gap limit tracking). */
  nextReceiveIndex: number;

  /** Next unused change address index. */
  nextChangeIndex: number;

  /** BIP44 account index (the `account'` level in the derivation path). */
  accountIndex: number;

  /** The default address type used for new receive addresses. */
  defaultAddressType: BitcoinAddressType;
}

/**
 * Parameters for creating a new Bitcoin account via the Snap keyring.
 */
export interface CreateBitcoinAccountParams {
  /** Target network scope (CAIP-2 chain ID). */
  scope: string;

  /** Entropy source identifier (maps to an HD seed / SRP). */
  entropySource?: string;

  /** Suggested account name override. */
  accountNameSuggestion?: string;
}
