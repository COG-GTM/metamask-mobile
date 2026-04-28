/**
 * Bitcoin transaction types.
 *
 * Bitcoin transactions differ from Ethereum transactions in that they
 * consume UTXOs as inputs and produce new UTXOs as outputs. There is
 * no concept of a nonce, gas limit, or gas price — instead, fees are
 * determined by the transaction's virtual size (vbytes) and the
 * chosen fee rate (sat/vB).
 */

import { BitcoinAddressType } from './address';
import { BitcoinUtxo } from './account';
import { BitcoinNetworkId } from './network';

/**
 * Transaction status in the Bitcoin network lifecycle.
 */
export enum BitcoinTransactionStatus {
  /** Created locally but not yet signed. */
  Created = 'created',

  /** Signed and ready to broadcast. */
  Signed = 'signed',

  /** Broadcast to the network, in the mempool. */
  Pending = 'pending',

  /** Included in a block with < required confirmations. */
  Confirming = 'confirming',

  /** Included in a block with >= required confirmations. */
  Confirmed = 'confirmed',

  /** Transaction failed or was dropped from the mempool. */
  Failed = 'failed',

  /** Replaced by another transaction (RBF). */
  Replaced = 'replaced',
}

/**
 * Fee rate recommendation tiers.
 *
 * Mirrors the common mempool.space API response structure.
 */
export interface BitcoinFeeRates {
  /** Fee rate for next-block confirmation (sat/vB). */
  fastest: number;

  /** Fee rate for ~30 min confirmation (sat/vB). */
  halfHour: number;

  /** Fee rate for ~1 hour confirmation (sat/vB). */
  hour: number;

  /** Fee rate for economy / low-priority (sat/vB). */
  economy: number;

  /** Minimum relay fee (sat/vB). */
  minimum: number;
}

/**
 * A selected UTXO to be consumed as a transaction input.
 */
export interface BitcoinTransactionInput {
  /** The UTXO being spent. */
  utxo: BitcoinUtxo;

  /** The scriptSig or witness data (populated after signing). */
  scriptSig?: string;

  /** Witness data for SegWit inputs (populated after signing). */
  witness?: string[];

  /** Sequence number (for RBF signaling: 0xfffffffd enables RBF). */
  sequence: number;
}

/**
 * A transaction output sending value to an address.
 */
export interface BitcoinTransactionOutput {
  /** Destination address. */
  address: string;

  /** Value in satoshis. */
  value: number;

  /** Address type of the recipient (affects output size calculation). */
  addressType: BitcoinAddressType;

  /** Whether this is a change output back to the sender's wallet. */
  isChange: boolean;
}

/**
 * Parameters for building a new Bitcoin transaction.
 */
export interface BitcoinTransactionParams {
  /** Target network. */
  networkId: BitcoinNetworkId;

  /** Recipient address. */
  recipientAddress: string;

  /** Amount to send in satoshis. */
  amount: number;

  /** Selected fee rate in sat/vB. */
  feeRate: number;

  /** Whether to send the entire balance (sweep). */
  sendMax: boolean;

  /**
   * Optional: manually selected UTXOs. If omitted, automatic UTXO
   * selection (coin selection) is performed.
   */
  selectedUtxos?: BitcoinUtxo[];

  /** Whether to signal Replace-By-Fee (BIP125). */
  enableRbf: boolean;

  /** Optional OP_RETURN data (max 80 bytes). */
  opReturnData?: string;
}

/**
 * A fully constructed (but possibly unsigned) Bitcoin transaction.
 */
export interface BitcoinTransaction {
  /** Internal transaction identifier. */
  id: string;

  /** CAIP-2 chain ID. */
  networkId: BitcoinNetworkId;

  /** Transaction inputs (UTXOs being consumed). */
  inputs: BitcoinTransactionInput[];

  /** Transaction outputs (value being sent). */
  outputs: BitcoinTransactionOutput[];

  /** Computed fee in satoshis. */
  fee: number;

  /** Fee rate in sat/vB. */
  feeRate: number;

  /** Virtual size in vbytes. */
  vsize: number;

  /** Current status. */
  status: BitcoinTransactionStatus;

  /** Raw serialized transaction hex (populated after signing). */
  rawHex?: string;

  /** Transaction ID / hash (populated after broadcast). */
  txid?: string;

  /** Block height at which the transaction was confirmed. */
  blockHeight?: number;

  /** Number of confirmations. */
  confirmations: number;

  /** Unix timestamp of creation. */
  createdAt: number;

  /** Unix timestamp of last status update. */
  updatedAt: number;
}

/**
 * Result of a coin selection algorithm.
 */
export interface CoinSelectionResult {
  /** Selected UTXOs to use as inputs. */
  inputs: BitcoinUtxo[];

  /** Transaction outputs including the change output (if any). */
  outputs: BitcoinTransactionOutput[];

  /** Total fee in satoshis. */
  fee: number;

  /** Whether a change output was generated. */
  hasChange: boolean;
}

/**
 * Supported coin selection strategies.
 */
export enum CoinSelectionStrategy {
  /** Select smallest UTXOs first to consolidate dust. */
  SmallestFirst = 'smallest-first',

  /** Select largest UTXOs first to minimize input count. */
  LargestFirst = 'largest-first',

  /** Branch and bound — optimal selection minimizing waste. */
  BranchAndBound = 'branch-and-bound',

  /** Random selection with change output. */
  Random = 'random',
}
