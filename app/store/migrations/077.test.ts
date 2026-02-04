import migrate, {
  DEFAULT_PORTFOLIO_ANALYTICS_CONTROLLER_STATE,
  PortfolioAnalyticsControllerState,
} from './077';
import { merge } from 'lodash';
import { captureException } from '@sentry/react-native';
import initialRootState, {
  backgroundState,
} from '../../util/test/initial-root-state';
import mockedEngine from '../../core/__mocks__/MockedEngine';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

jest.mock('../../core/Engine', () => ({
  init: () => mockedEngine.init(),
}));

interface MigratedState {
  engine: {
    backgroundState: Record<string, unknown> & {
      PortfolioAnalyticsController?: PortfolioAnalyticsControllerState;
    };
  };
}

describe('Migration #77 - Initialize PortfolioAnalyticsController state', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const invalidStates = [
    {
      state: null,
      errorMessage: "FATAL ERROR: Migration 77: Invalid state error: 'object'",
      scenario: 'state is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: null,
      }),
      errorMessage:
        "FATAL ERROR: Migration 77: Invalid engine state error: 'object'",
      scenario: 'engine state is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: null,
        },
      }),
      errorMessage:
        "FATAL ERROR: Migration 77: Invalid engine backgroundState error: 'object'",
      scenario: 'backgroundState is invalid',
    },
  ];

  for (const { errorMessage, scenario, state } of invalidStates) {
    it(`should capture exception if ${scenario}`, async () => {
      const newState = await migrate(state);

      expect(newState).toStrictEqual(state);
      expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
      expect(mockedCaptureException.mock.calls[0][0].message).toBe(
        errorMessage,
      );
    });
  }

  it('should insert default PortfolioAnalyticsController if missing and no transactions exist', async () => {
    const oldState = {
      ...initialRootState,
      engine: {
        backgroundState: {
          ...backgroundState,
          TransactionController: {
            transactions: [],
          },
        },
      },
    };

    const migratedState = (await migrate(oldState)) as MigratedState;

    expect(
      migratedState.engine.backgroundState.PortfolioAnalyticsController,
    ).toStrictEqual(DEFAULT_PORTFOLIO_ANALYTICS_CONTROLLER_STATE);
  });

  it('should not modify state if PortfolioAnalyticsController already exists', async () => {
    const existingControllerState = {
      isAnalyticsEnabled: false,
      lastAnalyticsUpdate: 1699999999999,
      portfolioMetrics: {
        totalTransactionCount: 5,
        uniqueNetworksUsed: ['0x1'],
        firstTransactionTimestamp: 1699999999000,
        lastTransactionTimestamp: 1699999999999,
      },
      migrationMetadata: {
        migratedFromExistingUser: true,
        migrationTimestamp: 1699999999999,
      },
    };

    const oldState = {
      ...initialRootState,
      engine: {
        backgroundState: {
          ...backgroundState,
          PortfolioAnalyticsController: existingControllerState,
        },
      },
    };

    const migratedState = (await migrate(oldState)) as MigratedState;

    expect(
      migratedState.engine.backgroundState.PortfolioAnalyticsController,
    ).toStrictEqual(existingControllerState);
  });

  it('should initialize analytics with transaction data for users with existing transactions', async () => {
    const mockTransactions = [
      { time: 1699999990000, chainId: '0x1' },
      { time: 1699999995000, chainId: '0x89' },
      { time: 1699999999000, chainId: '0x1' },
    ];

    const oldState = {
      ...initialRootState,
      engine: {
        backgroundState: {
          ...backgroundState,
          TransactionController: {
            transactions: mockTransactions,
          },
        },
      },
    };

    const migratedState = (await migrate(oldState)) as MigratedState;
    const portfolioController =
      migratedState.engine.backgroundState.PortfolioAnalyticsController;

    expect(portfolioController).toBeDefined();
    expect(portfolioController!.isAnalyticsEnabled).toBe(true);
    expect(portfolioController!.lastAnalyticsUpdate).toBe(1700000000000);
    expect(portfolioController!.portfolioMetrics.totalTransactionCount).toBe(3);
    expect(
      portfolioController!.portfolioMetrics.uniqueNetworksUsed.sort(),
    ).toEqual(['0x1', '0x89'].sort());
    expect(
      portfolioController!.portfolioMetrics.firstTransactionTimestamp,
    ).toBe(1699999990000);
    expect(portfolioController!.portfolioMetrics.lastTransactionTimestamp).toBe(
      1699999999000,
    );
    expect(portfolioController!.migrationMetadata.migratedFromExistingUser).toBe(
      true,
    );
    expect(portfolioController!.migrationMetadata.migrationTimestamp).toBe(
      1700000000000,
    );
  });

  it('should handle transactions without chainId gracefully', async () => {
    const mockTransactions = [
      { time: 1699999990000 },
      { time: 1699999995000, chainId: '0x1' },
    ];

    const oldState = {
      ...initialRootState,
      engine: {
        backgroundState: {
          ...backgroundState,
          TransactionController: {
            transactions: mockTransactions,
          },
        },
      },
    };

    const migratedState = (await migrate(oldState)) as MigratedState;
    const portfolioController =
      migratedState.engine.backgroundState.PortfolioAnalyticsController;

    expect(portfolioController!.portfolioMetrics.totalTransactionCount).toBe(2);
    expect(portfolioController!.portfolioMetrics.uniqueNetworksUsed).toEqual([
      '0x1',
    ]);
  });

  it('should handle transactions without time gracefully', async () => {
    const mockTransactions = [
      { chainId: '0x1' },
      { time: 1699999995000, chainId: '0x89' },
    ];

    const oldState = {
      ...initialRootState,
      engine: {
        backgroundState: {
          ...backgroundState,
          TransactionController: {
            transactions: mockTransactions,
          },
        },
      },
    };

    const migratedState = (await migrate(oldState)) as MigratedState;
    const portfolioController =
      migratedState.engine.backgroundState.PortfolioAnalyticsController;

    expect(portfolioController!.portfolioMetrics.totalTransactionCount).toBe(2);
    expect(
      portfolioController!.portfolioMetrics.firstTransactionTimestamp,
    ).toBe(1699999995000);
    expect(portfolioController!.portfolioMetrics.lastTransactionTimestamp).toBe(
      1699999995000,
    );
  });

  it('should handle missing TransactionController gracefully', async () => {
    const oldState = {
      ...initialRootState,
      engine: {
        backgroundState: {
          ...backgroundState,
          TransactionController: undefined,
        },
      },
    };

    const migratedState = (await migrate(oldState)) as MigratedState;

    expect(
      migratedState.engine.backgroundState.PortfolioAnalyticsController,
    ).toStrictEqual(DEFAULT_PORTFOLIO_ANALYTICS_CONTROLLER_STATE);
  });

  it('should handle TransactionController with non-array transactions', async () => {
    const oldState = {
      ...initialRootState,
      engine: {
        backgroundState: {
          ...backgroundState,
          TransactionController: {
            transactions: 'not-an-array',
          },
        },
      },
    };

    const migratedState = (await migrate(oldState)) as MigratedState;

    expect(
      migratedState.engine.backgroundState.PortfolioAnalyticsController,
    ).toStrictEqual(DEFAULT_PORTFOLIO_ANALYTICS_CONTROLLER_STATE);
  });

  it('should be idempotent - running migration twice produces same result', async () => {
    const mockTransactions = [
      { time: 1699999990000, chainId: '0x1' },
      { time: 1699999995000, chainId: '0x89' },
    ];

    const oldState = {
      ...initialRootState,
      engine: {
        backgroundState: {
          ...backgroundState,
          TransactionController: {
            transactions: mockTransactions,
          },
        },
      },
    };

    const firstMigration = (await migrate(oldState)) as MigratedState;
    const secondMigration = (await migrate(firstMigration)) as MigratedState;

    expect(
      firstMigration.engine.backgroundState.PortfolioAnalyticsController,
    ).toStrictEqual(
      secondMigration.engine.backgroundState.PortfolioAnalyticsController,
    );
  });

  it('should handle empty transactions array', async () => {
    const oldState = {
      ...initialRootState,
      engine: {
        backgroundState: {
          ...backgroundState,
          TransactionController: {
            transactions: [],
          },
        },
      },
    };

    const migratedState = (await migrate(oldState)) as MigratedState;
    const portfolioController =
      migratedState.engine.backgroundState.PortfolioAnalyticsController;

    expect(portfolioController!.migrationMetadata.migratedFromExistingUser).toBe(
      false,
    );
    expect(portfolioController!.portfolioMetrics.totalTransactionCount).toBe(0);
  });

  it('should handle transactions with invalid chainId types', async () => {
    const mockTransactions = [
      { time: 1699999990000, chainId: 123 },
      { time: 1699999995000, chainId: '0x1' },
    ];

    const oldState = {
      ...initialRootState,
      engine: {
        backgroundState: {
          ...backgroundState,
          TransactionController: {
            transactions: mockTransactions,
          },
        },
      },
    };

    const migratedState = (await migrate(oldState)) as MigratedState;
    const portfolioController =
      migratedState.engine.backgroundState.PortfolioAnalyticsController;

    expect(portfolioController!.portfolioMetrics.uniqueNetworksUsed).toEqual([
      '0x1',
    ]);
  });
});
