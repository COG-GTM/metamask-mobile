import {
  type TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { TokenRatesControllerState } from '@metamask/assets-controllers';
import type { Hex } from '@metamask/utils';

import {
  PortfolioAnalyticsController,
  getDefaultPortfolioAnalyticsControllerState,
  type PortfolioAnalyticsControllerMessenger,
  type PortfolioAnalyticsControllerState,
} from './PortfolioAnalyticsController';

const controllerName = 'PortfolioAnalyticsController';

function getMessengerMock(): PortfolioAnalyticsControllerMessenger {
  return {
    registerActionHandler: jest.fn(),
    registerInitialEventPayload: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
  } as unknown as PortfolioAnalyticsControllerMessenger;
}

function buildTransactionMeta(
  overrides: Partial<TransactionMeta> = {},
): TransactionMeta {
  return {
    id: 'test-tx-id',
    chainId: '0x1' as Hex,
    type: 'simpleSend',
    status: 'confirmed',
    time: Date.now(),
    txParams: {
      from: '0x123',
      to: '0x456',
      value: '0x1',
      gas: '0x5208',
      gasPrice: '0x3b9aca00',
    },
    txReceipt: {
      gasUsed: '0x5208',
      effectiveGasPrice: '0x3b9aca00',
    },
    ...overrides,
  } as unknown as TransactionMeta;
}

describe('PortfolioAnalyticsController', () => {
  let controller: PortfolioAnalyticsController;
  let messenger: PortfolioAnalyticsControllerMessenger;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    messenger = getMessengerMock();
    controller = new PortfolioAnalyticsController({
      messenger,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('initializes with default state', () => {
      expect(controller.state).toEqual(
        getDefaultPortfolioAnalyticsControllerState(),
      );
    });

    it('initializes with provided state', () => {
      const initialState: Partial<PortfolioAnalyticsControllerState> = {
        portfolioSnapshots: [
          {
            timestamp: 1000,
            chainId: '0x1' as Hex,
            totalValueUsd: 100,
            tokenBalances: {},
          },
        ],
        lastSnapshotTimestamp: 1000,
      };

      const controllerWithState = new PortfolioAnalyticsController({
        messenger,
        state: initialState,
      });

      expect(controllerWithState.state.portfolioSnapshots).toHaveLength(1);
      expect(controllerWithState.state.lastSnapshotTimestamp).toBe(1000);
    });
  });

  describe('recordTransactionFinished', () => {
    it('records transaction analytics', () => {
      const transactionMeta = buildTransactionMeta();

      controller.recordTransactionFinished(transactionMeta);

      expect(controller.state.transactionAnalytics).toHaveLength(1);
      expect(controller.state.transactionAnalytics[0]).toMatchObject({
        id: 'test-tx-id',
        chainId: '0x1',
        type: 'simpleSend',
        status: 'confirmed',
      });
    });

    it('calculates gas fee from receipt', () => {
      const transactionMeta = buildTransactionMeta({
        txReceipt: {
          gasUsed: '0x5208',
          effectiveGasPrice: '0x3b9aca00',
        },
      });

      controller.recordTransactionFinished(transactionMeta);

      const expectedGasFee = (BigInt(0x5208) * BigInt(0x3b9aca00)).toString();
      expect(controller.state.transactionAnalytics[0].gasFeeNative).toBe(
        expectedGasFee,
      );
    });

    it('handles missing txReceipt', () => {
      const transactionMeta = buildTransactionMeta({
        txReceipt: undefined,
      });

      controller.recordTransactionFinished(transactionMeta);

      expect(controller.state.transactionAnalytics[0].gasFeeNative).toBe('0');
    });

    it('handles missing type', () => {
      const transactionMeta = buildTransactionMeta({
        type: undefined,
      });

      controller.recordTransactionFinished(transactionMeta);

      expect(controller.state.transactionAnalytics[0].type).toBe('unknown');
    });
  });

  describe('recordTokenRatesUpdate', () => {
    it('creates portfolio snapshot from token rates', () => {
      const tokenRatesState = {
        marketData: {
          '0x1': {
            '0xtoken1': { price: 100 },
            '0xtoken2': { price: 200 },
          },
        },
      } as unknown as TokenRatesControllerState;

      controller.recordTokenRatesUpdate(tokenRatesState);

      expect(controller.state.portfolioSnapshots).toHaveLength(1);
      expect(controller.state.portfolioSnapshots[0].chainId).toBe('0x1');
      expect(controller.state.portfolioSnapshots[0].totalValueUsd).toBe(300);
    });

    it('does not create snapshot if interval not passed', () => {
      const tokenRatesState = {
        marketData: {
          '0x1': {
            '0xtoken1': { price: 100 },
          },
        },
      } as unknown as TokenRatesControllerState;

      controller.recordTokenRatesUpdate(tokenRatesState);
      controller.recordTokenRatesUpdate(tokenRatesState);

      expect(controller.state.portfolioSnapshots).toHaveLength(1);
    });

    it('creates new snapshot after interval passes', () => {
      const tokenRatesState = {
        marketData: {
          '0x1': {
            '0xtoken1': { price: 100 },
          },
        },
      } as unknown as TokenRatesControllerState;

      controller.recordTokenRatesUpdate(tokenRatesState);

      jest.advanceTimersByTime(60 * 60 * 1000 + 1);

      controller.recordTokenRatesUpdate(tokenRatesState);

      expect(controller.state.portfolioSnapshots).toHaveLength(2);
    });

    it('handles empty marketData', () => {
      const tokenRatesState = {
        marketData: {},
      } as unknown as TokenRatesControllerState;

      controller.recordTokenRatesUpdate(tokenRatesState);

      expect(controller.state.portfolioSnapshots).toHaveLength(0);
    });

    it('handles missing marketData', () => {
      const tokenRatesState = {} as unknown as TokenRatesControllerState;

      controller.recordTokenRatesUpdate(tokenRatesState);

      expect(controller.state.portfolioSnapshots).toHaveLength(0);
    });
  });

  describe('getTransactionAnalytics', () => {
    beforeEach(() => {
      const tx1 = buildTransactionMeta({
        id: 'tx1',
        chainId: '0x1' as Hex,
        time: 1000,
      });
      const tx2 = buildTransactionMeta({
        id: 'tx2',
        chainId: '0x89' as Hex,
        time: 2000,
      });
      const tx3 = buildTransactionMeta({
        id: 'tx3',
        chainId: '0x1' as Hex,
        time: 3000,
      });

      controller.recordTransactionFinished(tx1);
      controller.recordTransactionFinished(tx2);
      controller.recordTransactionFinished(tx3);
    });

    it('returns all transactions without filters', () => {
      const analytics = controller.getTransactionAnalytics();
      expect(analytics).toHaveLength(3);
    });

    it('filters by chainId', () => {
      const analytics = controller.getTransactionAnalytics({
        chainId: '0x1' as Hex,
      });
      expect(analytics).toHaveLength(2);
      expect(analytics.every((tx) => tx.chainId === '0x1')).toBe(true);
    });

    it('filters by startTime', () => {
      const analytics = controller.getTransactionAnalytics({
        startTime: 1500,
      });
      expect(analytics).toHaveLength(2);
    });

    it('filters by endTime', () => {
      const analytics = controller.getTransactionAnalytics({
        endTime: 2500,
      });
      expect(analytics).toHaveLength(2);
    });

    it('filters by multiple criteria', () => {
      const analytics = controller.getTransactionAnalytics({
        chainId: '0x1' as Hex,
        startTime: 500,
        endTime: 2500,
      });
      expect(analytics).toHaveLength(1);
      expect(analytics[0].id).toBe('tx1');
    });
  });

  describe('getPortfolioSnapshots', () => {
    beforeEach(() => {
      const controllerWithSnapshots = new PortfolioAnalyticsController({
        messenger,
        state: {
          portfolioSnapshots: [
            {
              timestamp: 1000,
              chainId: '0x1' as Hex,
              totalValueUsd: 100,
              tokenBalances: {},
            },
            {
              timestamp: 2000,
              chainId: '0x89' as Hex,
              totalValueUsd: 200,
              tokenBalances: {},
            },
            {
              timestamp: 3000,
              chainId: '0x1' as Hex,
              totalValueUsd: 300,
              tokenBalances: {},
            },
          ],
        },
      });
      controller = controllerWithSnapshots;
    });

    it('returns all snapshots without filters', () => {
      const snapshots = controller.getPortfolioSnapshots();
      expect(snapshots).toHaveLength(3);
    });

    it('filters by chainId', () => {
      const snapshots = controller.getPortfolioSnapshots({
        chainId: '0x1' as Hex,
      });
      expect(snapshots).toHaveLength(2);
    });

    it('filters by time range', () => {
      const snapshots = controller.getPortfolioSnapshots({
        startTime: 1500,
        endTime: 2500,
      });
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].timestamp).toBe(2000);
    });
  });

  describe('generateAggregatedMetrics', () => {
    beforeEach(() => {
            const tx1 = buildTransactionMeta({
              id: 'tx1',
              chainId: '0x1' as Hex,
              type: TransactionType.simpleSend,
              time: 1000,
            });
            const tx2 = buildTransactionMeta({
              id: 'tx2',
              chainId: '0x89' as Hex,
              type: TransactionType.swap,
              time: 2000,
            });
            const tx3 = buildTransactionMeta({
              id: 'tx3',
              chainId: '0x1' as Hex,
              type: TransactionType.simpleSend,
              time: 3000,
            });

      controller.recordTransactionFinished(tx1);
      controller.recordTransactionFinished(tx2);
      controller.recordTransactionFinished(tx3);
    });

    it('generates aggregated metrics for period', () => {
      const metrics = controller.generateAggregatedMetrics(0, 5000);

      expect(metrics.totalTransactions).toBe(3);
      expect(metrics.periodStart).toBe(0);
      expect(metrics.periodEnd).toBe(5000);
    });

    it('counts transactions by type', () => {
      const metrics = controller.generateAggregatedMetrics(0, 5000);

      expect(metrics.transactionsByType['simpleSend']).toBe(2);
      expect(metrics.transactionsByType['swap']).toBe(1);
    });

    it('counts transactions by chain', () => {
      const metrics = controller.generateAggregatedMetrics(0, 5000);

      expect(metrics.transactionsByChain['0x1']).toBe(2);
      expect(metrics.transactionsByChain['0x89']).toBe(1);
    });
  });

  describe('getDefaultPortfolioAnalyticsControllerState', () => {
    it('returns correct default state', () => {
      const defaultState = getDefaultPortfolioAnalyticsControllerState();

      expect(defaultState).toEqual({
        portfolioSnapshots: [],
        transactionAnalytics: [],
        aggregatedMetrics: [],
        lastSnapshotTimestamp: null,
        lastCleanupTimestamp: null,
      });
    });
  });
});
