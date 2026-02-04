import {
  BaseController,
  type ControllerGetStateAction,
  type ControllerStateChangeEvent,
  type RestrictedMessenger,
} from '@metamask/base-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { TokenRatesControllerState } from '@metamask/assets-controllers';
import type { Hex } from '@metamask/utils';

const controllerName = 'PortfolioAnalyticsController';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const DETAILED_DATA_RETENTION_MS = ONE_YEAR_MS;

export type PortfolioSnapshot = {
  timestamp: number;
  chainId: Hex;
  totalValueUsd: number;
  tokenBalances: Record<string, { balance: string; valueUsd: number }>;
};

export type TransactionAnalytics = {
  id: string;
  timestamp: number;
  chainId: Hex;
  type: string;
  status: string;
  gasFeeNative: string;
  gasFeeUsd: number | null;
  valueNative: string;
  valueUsd: number | null;
  tokenAddress?: string;
  tokenSymbol?: string;
};

export type AggregatedMetrics = {
  periodStart: number;
  periodEnd: number;
  totalTransactions: number;
  totalGasFeeUsd: number;
  totalValueTransferredUsd: number;
  transactionsByType: Record<string, number>;
  transactionsByChain: Record<Hex, number>;
};

export type PortfolioAnalyticsControllerState = {
  portfolioSnapshots: PortfolioSnapshot[];
  transactionAnalytics: TransactionAnalytics[];
  aggregatedMetrics: AggregatedMetrics[];
  lastSnapshotTimestamp: number | null;
  lastCleanupTimestamp: number | null;
};

export const getDefaultPortfolioAnalyticsControllerState =
  (): PortfolioAnalyticsControllerState => ({
    portfolioSnapshots: [],
    transactionAnalytics: [],
    aggregatedMetrics: [],
    lastSnapshotTimestamp: null,
    lastCleanupTimestamp: null,
  });

export type PortfolioAnalyticsControllerGetStateAction =
  ControllerGetStateAction<
    typeof controllerName,
    PortfolioAnalyticsControllerState
  >;

export type PortfolioAnalyticsControllerActions =
  PortfolioAnalyticsControllerGetStateAction;

export type PortfolioAnalyticsControllerStateChangeEvent =
  ControllerStateChangeEvent<
    typeof controllerName,
    PortfolioAnalyticsControllerState
  >;

export type PortfolioAnalyticsControllerEvents =
  PortfolioAnalyticsControllerStateChangeEvent;

type AllowedActions = never;

type AllowedEvents = never;

export type PortfolioAnalyticsControllerMessenger = RestrictedMessenger<
  typeof controllerName,
  PortfolioAnalyticsControllerActions | AllowedActions,
  PortfolioAnalyticsControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

const metadata = {
  portfolioSnapshots: { persist: true, anonymous: false },
  transactionAnalytics: { persist: true, anonymous: false },
  aggregatedMetrics: { persist: true, anonymous: false },
  lastSnapshotTimestamp: { persist: true, anonymous: false },
  lastCleanupTimestamp: { persist: true, anonymous: false },
};

export class PortfolioAnalyticsController extends BaseController<
  typeof controllerName,
  PortfolioAnalyticsControllerState,
  PortfolioAnalyticsControllerMessenger
> {
  constructor({
    messenger,
    state,
  }: {
    messenger: PortfolioAnalyticsControllerMessenger;
    state?: Partial<PortfolioAnalyticsControllerState>;
  }) {
    super({
      messenger,
      metadata,
      name: controllerName,
      state: {
        ...getDefaultPortfolioAnalyticsControllerState(),
        ...state,
      },
    });
  }

  recordTransactionFinished(transactionMeta: TransactionMeta): void {
    const { id, chainId, type, status, txParams, txReceipt, time } =
      transactionMeta;

    const gasFeeNative = this.#calculateGasFee(txParams, txReceipt);

    const transactionAnalytics: TransactionAnalytics = {
      id,
      timestamp: time ?? Date.now(),
      chainId: chainId as Hex,
      type: type ?? 'unknown',
      status: status ?? 'unknown',
      gasFeeNative,
      gasFeeUsd: null,
      valueNative: txParams?.value?.toString() ?? '0',
      valueUsd: null,
    };

    this.update((state) => {
      state.transactionAnalytics.push(transactionAnalytics);
    });

    this.#cleanupOldData();
  }

  recordTokenRatesUpdate(tokenRatesState: TokenRatesControllerState): void {
    const now = Date.now();
    const lastSnapshot = this.state.lastSnapshotTimestamp;

    const SNAPSHOT_INTERVAL_MS = 60 * 60 * 1000;
    if (lastSnapshot && now - lastSnapshot < SNAPSHOT_INTERVAL_MS) {
      return;
    }

    const { marketData } = tokenRatesState;

    if (!marketData || Object.keys(marketData).length === 0) {
      return;
    }

    const snapshots: PortfolioSnapshot[] = [];

    for (const [chainId, tokens] of Object.entries(marketData)) {
      const tokenBalances: Record<string, { balance: string; valueUsd: number }> = {};
      let totalValueUsd = 0;

      for (const [tokenAddress, tokenData] of Object.entries(tokens)) {
        if (tokenData?.price) {
          tokenBalances[tokenAddress] = {
            balance: '0',
            valueUsd: tokenData.price,
          };
          totalValueUsd += tokenData.price;
        }
      }

      if (Object.keys(tokenBalances).length > 0) {
        snapshots.push({
          timestamp: now,
          chainId: chainId as Hex,
          totalValueUsd,
          tokenBalances,
        });
      }
    }

    if (snapshots.length > 0) {
      this.update((state) => {
        state.portfolioSnapshots.push(...snapshots);
        state.lastSnapshotTimestamp = now;
      });
    }

    this.#cleanupOldData();
  }

  getTransactionAnalytics(options?: {
    chainId?: Hex;
    startTime?: number;
    endTime?: number;
  }): TransactionAnalytics[] {
    let analytics = [...this.state.transactionAnalytics];

    if (options?.chainId) {
      analytics = analytics.filter((tx) => tx.chainId === options.chainId);
    }

    if (options?.startTime) {
      analytics = analytics.filter((tx) => tx.timestamp >= options.startTime!);
    }

    if (options?.endTime) {
      analytics = analytics.filter((tx) => tx.timestamp <= options.endTime!);
    }

    return analytics;
  }

  getPortfolioSnapshots(options?: {
    chainId?: Hex;
    startTime?: number;
    endTime?: number;
  }): PortfolioSnapshot[] {
    let snapshots = [...this.state.portfolioSnapshots];

    if (options?.chainId) {
      snapshots = snapshots.filter((s) => s.chainId === options.chainId);
    }

    if (options?.startTime) {
      snapshots = snapshots.filter((s) => s.timestamp >= options.startTime!);
    }

    if (options?.endTime) {
      snapshots = snapshots.filter((s) => s.timestamp <= options.endTime!);
    }

    return snapshots;
  }

  generateAggregatedMetrics(periodStart: number, periodEnd: number): AggregatedMetrics {
    const transactions = this.getTransactionAnalytics({
      startTime: periodStart,
      endTime: periodEnd,
    });

    const metrics: AggregatedMetrics = {
      periodStart,
      periodEnd,
      totalTransactions: transactions.length,
      totalGasFeeUsd: 0,
      totalValueTransferredUsd: 0,
      transactionsByType: {},
      transactionsByChain: {},
    };

    for (const tx of transactions) {
      if (tx.gasFeeUsd) {
        metrics.totalGasFeeUsd += tx.gasFeeUsd;
      }
      if (tx.valueUsd) {
        metrics.totalValueTransferredUsd += tx.valueUsd;
      }

      metrics.transactionsByType[tx.type] =
        (metrics.transactionsByType[tx.type] || 0) + 1;

      metrics.transactionsByChain[tx.chainId] =
        (metrics.transactionsByChain[tx.chainId] || 0) + 1;
    }

    return metrics;
  }

  #calculateGasFee(
    txParams?: TransactionMeta['txParams'],
    txReceipt?: TransactionMeta['txReceipt'],
  ): string {
    if (!txReceipt || !txParams) {
      return '0';
    }

    const gasUsed = txReceipt.gasUsed;
    const effectiveGasPrice = txReceipt.effectiveGasPrice;

    if (gasUsed && effectiveGasPrice) {
      const gasUsedBigInt = BigInt(gasUsed.toString());
      const effectiveGasPriceBigInt = BigInt(effectiveGasPrice.toString());
      return (gasUsedBigInt * effectiveGasPriceBigInt).toString();
    }

    return '0';
  }

  #cleanupOldData(): void {
    const now = Date.now();
    const lastCleanup = this.state.lastCleanupTimestamp;

    const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
    if (lastCleanup && now - lastCleanup < CLEANUP_INTERVAL_MS) {
      return;
    }

    const cutoffTime = now - DETAILED_DATA_RETENTION_MS;

    this.update((state) => {
      const oldTransactions = state.transactionAnalytics.filter(
        (tx) => tx.timestamp < cutoffTime,
      );

      if (oldTransactions.length > 0) {
        const aggregated = this.#aggregateTransactions(oldTransactions);
        state.aggregatedMetrics.push(aggregated);
      }

      state.transactionAnalytics = state.transactionAnalytics.filter(
        (tx) => tx.timestamp >= cutoffTime,
      );

      state.portfolioSnapshots = state.portfolioSnapshots.filter(
        (snapshot) => snapshot.timestamp >= cutoffTime,
      );

      state.lastCleanupTimestamp = now;
    });
  }

  #aggregateTransactions(transactions: TransactionAnalytics[]): AggregatedMetrics {
    if (transactions.length === 0) {
      return {
        periodStart: 0,
        periodEnd: 0,
        totalTransactions: 0,
        totalGasFeeUsd: 0,
        totalValueTransferredUsd: 0,
        transactionsByType: {},
        transactionsByChain: {},
      };
    }

    const timestamps = transactions.map((tx) => tx.timestamp);
    const periodStart = Math.min(...timestamps);
    const periodEnd = Math.max(...timestamps);

    return this.generateAggregatedMetrics(periodStart, periodEnd);
  }
}
