import Logger from '../../../../util/Logger';

/**
 * UTXO (Unspent Transaction Output) from the Bitcoin network.
 */
export interface BitcoinUtxo {
  txid: string;
  vout: number;
  value: number;
  status: {
    confirmed: boolean;
    blockHeight?: number;
    blockHash?: string;
    blockTime?: number;
  };
}

/**
 * Bitcoin address balance info.
 */
export interface BitcoinAddressBalance {
  address: string;
  funded: number;
  spent: number;
  balance: number;
}

/**
 * Bitcoin transaction from the network.
 */
export interface BitcoinTransaction {
  txid: string;
  version: number;
  locktime: number;
  size: number;
  weight: number;
  fee: number;
  status: {
    confirmed: boolean;
    blockHeight?: number;
    blockHash?: string;
    blockTime?: number;
  };
}

/**
 * Recommended fee rates from the mempool API.
 */
export interface BitcoinFeeEstimates {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

export interface BitcoinNetworkClientConfig {
  baseUrl: string;
}

const MAINNET_BASE_URL = 'https://mempool.space/api';
const TESTNET_BASE_URL = 'https://mempool.space/testnet/api';

/**
 * Network client for Bitcoin RPC/API communication.
 * Uses mempool.space REST API for UTXO-based queries.
 */
export class BitcoinNetworkClient {
  private readonly baseUrl: string;

  constructor(config?: BitcoinNetworkClientConfig) {
    this.baseUrl = config?.baseUrl ?? MAINNET_BASE_URL;
  }

  static mainnet(): BitcoinNetworkClient {
    return new BitcoinNetworkClient({ baseUrl: MAINNET_BASE_URL });
  }

  static testnet(): BitcoinNetworkClient {
    return new BitcoinNetworkClient({ baseUrl: TESTNET_BASE_URL });
  }

  /**
   * Fetch UTXOs for a Bitcoin address.
   *
   * @param address - The Bitcoin address.
   * @returns Array of UTXOs.
   */
  async getUtxos(address: string): Promise<BitcoinUtxo[]> {
    const url = `${this.baseUrl}/address/${address}/utxo`;
    return this.fetchJson<BitcoinUtxo[]>(url);
  }

  /**
   * Fetch balance for a Bitcoin address.
   *
   * @param address - The Bitcoin address.
   * @returns Address balance information.
   */
  async getBalance(address: string): Promise<BitcoinAddressBalance> {
    const url = `${this.baseUrl}/address/${address}`;
    const data = await this.fetchJson<{
      address: string;
      chain_stats: { funded_txo_sum: number; spent_txo_sum: number };
      mempool_stats: { funded_txo_sum: number; spent_txo_sum: number };
    }>(url);

    const funded =
      data.chain_stats.funded_txo_sum + data.mempool_stats.funded_txo_sum;
    const spent =
      data.chain_stats.spent_txo_sum + data.mempool_stats.spent_txo_sum;

    return {
      address: data.address,
      funded,
      spent,
      balance: funded - spent,
    };
  }

  /**
   * Fetch transactions for a Bitcoin address.
   *
   * @param address - The Bitcoin address.
   * @returns Array of transactions.
   */
  async getTransactions(address: string): Promise<BitcoinTransaction[]> {
    const url = `${this.baseUrl}/address/${address}/txs`;
    return this.fetchJson<BitcoinTransaction[]>(url);
  }

  /**
   * Fetch recommended fee estimates.
   *
   * @returns Fee estimates in sat/vB.
   */
  async getFeeEstimates(): Promise<BitcoinFeeEstimates> {
    const url = `${this.baseUrl}/v1/fees/recommended`;
    return this.fetchJson<BitcoinFeeEstimates>(url);
  }

  /**
   * Broadcast a raw transaction hex to the network.
   *
   * @param rawTxHex - The signed raw transaction hex.
   * @returns The transaction ID.
   */
  async broadcastTransaction(rawTxHex: string): Promise<string> {
    const url = `${this.baseUrl}/tx`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: rawTxHex,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to broadcast transaction: ${response.status} ${errorText}`,
      );
    }
    return response.text();
  }

  private async fetchJson<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      Logger.error(
        error as Error,
        `BitcoinNetworkClient: Failed to fetch ${url}`,
      );
      throw error;
    }
  }
}
