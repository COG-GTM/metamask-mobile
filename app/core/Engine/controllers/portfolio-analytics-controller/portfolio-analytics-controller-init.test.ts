import type { TransactionMeta } from '@metamask/transaction-controller';
import type { TokenRatesControllerState } from '@metamask/assets-controllers';

import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import { buildControllerInitRequestMock } from '../../utils/test-utils';
import type { ControllerInitRequest } from '../../types';
import type { PortfolioAnalyticsControllerMessenger } from './PortfolioAnalyticsController';
import type { PortfolioAnalyticsControllerInitMessenger } from '../../messengers/portfolio-analytics-controller-messenger/portfolio-analytics-controller-messenger';
import { PortfolioAnalyticsControllerInit } from './portfolio-analytics-controller-init';
import { PortfolioAnalyticsController } from './PortfolioAnalyticsController';

jest.mock('./PortfolioAnalyticsController');

function buildInitRequestMock(
  initRequestProperties: Record<string, unknown> = {},
): jest.Mocked<
  ControllerInitRequest<
    PortfolioAnalyticsControllerMessenger,
    PortfolioAnalyticsControllerInitMessenger
  >
> {
  const baseControllerMessenger = new ExtendedControllerMessenger();
  const initMessenger = {
    subscribe: jest.fn(),
  };

  const requestMock = {
    ...buildControllerInitRequestMock(baseControllerMessenger),
    controllerMessenger:
      baseControllerMessenger as unknown as PortfolioAnalyticsControllerMessenger,
    initMessenger:
      initMessenger as unknown as PortfolioAnalyticsControllerInitMessenger,
    persistedState: {
      PortfolioAnalyticsController: {},
    },
    ...initRequestProperties,
  };

  return requestMock;
}

describe('PortfolioAnalyticsController Init', () => {
  const portfolioAnalyticsControllerClassMock = jest.mocked(
    PortfolioAnalyticsController,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      PortfolioAnalyticsControllerInit(requestMock).controller,
    ).toBeInstanceOf(PortfolioAnalyticsController);
  });

  it('throws error if controller initialization fails', () => {
    portfolioAnalyticsControllerClassMock.mockImplementationOnce(() => {
      throw new Error('Controller initialization failed');
    });
    const requestMock = buildInitRequestMock();

    expect(() => PortfolioAnalyticsControllerInit(requestMock)).toThrow(
      'Controller initialization failed',
    );
  });

  it('passes persisted state to controller', () => {
    const mockState = {
      portfolioSnapshots: [],
      transactionAnalytics: [],
      aggregatedMetrics: [],
      lastSnapshotTimestamp: null,
      lastCleanupTimestamp: null,
    };
    const requestMock = buildInitRequestMock({
      persistedState: {
        PortfolioAnalyticsController: mockState,
      },
    });

    PortfolioAnalyticsControllerInit(requestMock);

    const constructorOptions =
      portfolioAnalyticsControllerClassMock.mock.calls[0][0];
    expect(constructorOptions.state).toBe(mockState);
  });

  describe('event subscriptions', () => {
    it('subscribes to TransactionController:transactionConfirmed', () => {
      const initMessenger = {
        subscribe: jest.fn(),
      };
      const requestMock = buildInitRequestMock({
        initMessenger:
          initMessenger as unknown as PortfolioAnalyticsControllerInitMessenger,
      });

      PortfolioAnalyticsControllerInit(requestMock);

      expect(initMessenger.subscribe).toHaveBeenCalledWith(
        'TransactionController:transactionConfirmed',
        expect.any(Function),
      );
    });

    it('subscribes to TransactionController:transactionDropped', () => {
      const initMessenger = {
        subscribe: jest.fn(),
      };
      const requestMock = buildInitRequestMock({
        initMessenger:
          initMessenger as unknown as PortfolioAnalyticsControllerInitMessenger,
      });

      PortfolioAnalyticsControllerInit(requestMock);

      expect(initMessenger.subscribe).toHaveBeenCalledWith(
        'TransactionController:transactionDropped',
        expect.any(Function),
      );
    });

    it('subscribes to TransactionController:transactionFailed', () => {
      const initMessenger = {
        subscribe: jest.fn(),
      };
      const requestMock = buildInitRequestMock({
        initMessenger:
          initMessenger as unknown as PortfolioAnalyticsControllerInitMessenger,
      });

      PortfolioAnalyticsControllerInit(requestMock);

      expect(initMessenger.subscribe).toHaveBeenCalledWith(
        'TransactionController:transactionFailed',
        expect.any(Function),
      );
    });

    it('subscribes to TokenRatesController:stateChange', () => {
      const initMessenger = {
        subscribe: jest.fn(),
      };
      const requestMock = buildInitRequestMock({
        initMessenger:
          initMessenger as unknown as PortfolioAnalyticsControllerInitMessenger,
      });

      PortfolioAnalyticsControllerInit(requestMock);

      expect(initMessenger.subscribe).toHaveBeenCalledWith(
        'TokenRatesController:stateChange',
        expect.any(Function),
      );
    });

    it('calls recordTransactionFinished when transactionConfirmed event fires', () => {
      const mockRecordTransactionFinished = jest.fn();
      portfolioAnalyticsControllerClassMock.mockImplementationOnce(
        () =>
          ({
            recordTransactionFinished: mockRecordTransactionFinished,
          }) as unknown as PortfolioAnalyticsController,
      );

      const initMessenger = {
        subscribe: jest.fn(),
      };
      const requestMock = buildInitRequestMock({
        initMessenger:
          initMessenger as unknown as PortfolioAnalyticsControllerInitMessenger,
      });

      PortfolioAnalyticsControllerInit(requestMock);

      const transactionConfirmedCallback = initMessenger.subscribe.mock.calls.find(
        (call) => call[0] === 'TransactionController:transactionConfirmed',
      )?.[1];

      const mockTransactionMeta = {
        id: 'test-tx-id',
        chainId: '0x1',
        status: 'confirmed',
      } as unknown as TransactionMeta;

      transactionConfirmedCallback?.(mockTransactionMeta);

      expect(mockRecordTransactionFinished).toHaveBeenCalledWith(
        mockTransactionMeta,
      );
    });

    it('calls recordTokenRatesUpdate when TokenRatesController:stateChange event fires', () => {
      const mockRecordTokenRatesUpdate = jest.fn();
      portfolioAnalyticsControllerClassMock.mockImplementationOnce(
        () =>
          ({
            recordTokenRatesUpdate: mockRecordTokenRatesUpdate,
          }) as unknown as PortfolioAnalyticsController,
      );

      const initMessenger = {
        subscribe: jest.fn(),
      };
      const requestMock = buildInitRequestMock({
        initMessenger:
          initMessenger as unknown as PortfolioAnalyticsControllerInitMessenger,
      });

      PortfolioAnalyticsControllerInit(requestMock);

      const tokenRatesCallback = initMessenger.subscribe.mock.calls.find(
        (call) => call[0] === 'TokenRatesController:stateChange',
      )?.[1];

      const mockTokenRatesState = {
        marketData: {
          '0x1': {
            '0xtoken': { price: 100 },
          },
        },
      } as unknown as TokenRatesControllerState;

      tokenRatesCallback?.(mockTokenRatesState);

      expect(mockRecordTokenRatesUpdate).toHaveBeenCalledWith(
        mockTokenRatesState,
      );
    });
  });
});
