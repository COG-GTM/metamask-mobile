import { hasProperty, isObject } from '@metamask/utils';
import { ensureValidState } from './util';
import { captureException } from '@sentry/react-native';

/**
 * Default state for PortfolioAnalyticsController
 * This represents the initial state for users who don't have any analytics data yet
 */
export const DEFAULT_PORTFOLIO_ANALYTICS_CONTROLLER_STATE = {
  isAnalyticsEnabled: true,
  lastAnalyticsUpdate: null as number | null,
  portfolioMetrics: {
    totalTransactionCount: 0,
    uniqueNetworksUsed: [] as string[],
    firstTransactionTimestamp: null as number | null,
    lastTransactionTimestamp: null as number | null,
  },
  migrationMetadata: {
    migratedFromExistingUser: false,
    migrationTimestamp: null as number | null,
  },
};

export type PortfolioAnalyticsControllerState =
  typeof DEFAULT_PORTFOLIO_ANALYTICS_CONTROLLER_STATE;

/**
 * Migration 77: Initialize PortfolioAnalyticsController state for existing users
 *
 * This migration:
 * 1. Creates the PortfolioAnalyticsController state if it doesn't exist
 * 2. For users with existing transaction history, initializes analytics based on their transactions
 * 3. Marks users as migrated from existing state
 * 4. Is idempotent - running it multiple times produces the same result
 *
 * @param state - The current MetaMask mobile state
 * @returns Migrated Redux state
 */
export default function migrate(state: unknown) {
  const migrationVersion = 77;

  if (!ensureValidState(state, migrationVersion)) {
    return state;
  }

  const { backgroundState } = state.engine;

  if (
    hasProperty(backgroundState, 'PortfolioAnalyticsController') &&
    isObject(backgroundState.PortfolioAnalyticsController)
  ) {
    return state;
  }

  try {
    const transactionController = backgroundState.TransactionController;
    const hasExistingTransactions =
      isObject(transactionController) &&
      hasProperty(transactionController, 'transactions') &&
      Array.isArray(transactionController.transactions) &&
      transactionController.transactions.length > 0;

    if (hasExistingTransactions) {
      const transactions = transactionController.transactions as Array<{
        time?: number;
        chainId?: string;
      }>;

      const uniqueNetworks = new Set<string>();
      let firstTimestamp: number | null = null;
      let lastTimestamp: number | null = null;

      for (const tx of transactions) {
        if (tx.chainId && typeof tx.chainId === 'string') {
          uniqueNetworks.add(tx.chainId);
        }

        if (typeof tx.time === 'number') {
          if (firstTimestamp === null || tx.time < firstTimestamp) {
            firstTimestamp = tx.time;
          }
          if (lastTimestamp === null || tx.time > lastTimestamp) {
            lastTimestamp = tx.time;
          }
        }
      }

      backgroundState.PortfolioAnalyticsController = {
        isAnalyticsEnabled: true,
        lastAnalyticsUpdate: Date.now(),
        portfolioMetrics: {
          totalTransactionCount: transactions.length,
          uniqueNetworksUsed: Array.from(uniqueNetworks),
          firstTransactionTimestamp: firstTimestamp,
          lastTransactionTimestamp: lastTimestamp,
        },
        migrationMetadata: {
          migratedFromExistingUser: true,
          migrationTimestamp: Date.now(),
        },
      };
    } else {
      backgroundState.PortfolioAnalyticsController = {
        ...DEFAULT_PORTFOLIO_ANALYTICS_CONTROLLER_STATE,
      };
    }

    return state;
  } catch (error) {
    captureException(
      new Error(`Migration ${migrationVersion} failed: ${error}`),
    );
    return state;
  }
}
