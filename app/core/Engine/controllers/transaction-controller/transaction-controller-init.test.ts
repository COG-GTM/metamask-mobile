import {
  TransactionController,
  TransactionControllerMessenger,
  TransactionControllerOptions,
  TransactionMeta,
  TransactionType,
  type PublishBatchHookTransaction,
} from '@metamask/transaction-controller';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller/dist/types';
import { NetworkController } from '@metamask/network-controller';

import { selectSwapsChainFeatureFlags } from '../../../../reducers/swaps';
import { selectShouldUseSmartTransaction } from '../../../../selectors/smartTransactionsController';
import { getGlobalChainId } from '../../../../util/networks/global-network';
import {
  submitBatchSmartTransactionHook,
  submitSmartTransactionHook,
} from '../../../../util/smart-transactions/smart-publish-hook';
import { getTransactionById } from '../../../../util/transactions';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import { buildControllerInitRequestMock } from '../../utils/test-utils';
import { TransactionControllerInitMessenger } from '../../messengers/transaction-controller-messenger';
import { ControllerInitRequest } from '../../types';
import { TransactionControllerInit } from './transaction-controller-init';
import {
  handleTransactionAddedEventForMetrics,
  handleTransactionApprovedEventForMetrics,
  handleTransactionFinalizedEventForMetrics,
  handleTransactionRejectedEventForMetrics,
  handleTransactionSubmittedEventForMetrics,
} from './event-handlers/metrics';
import { handleShowNotification } from './event-handlers/notification';
import { Hex } from '@metamask/utils';

jest.mock('@metamask/transaction-controller');
jest.mock('../../../../reducers/swaps');
jest.mock('../../../../selectors/smartTransactionsController');
jest.mock('../../../../util/networks/global-network');
jest.mock('../../../../util/smart-transactions/smart-publish-hook');
jest.mock('./event-handlers/metrics');
jest.mock('./event-handlers/notification');
jest.mock('../../../../util/transactions', () => ({
  getTransactionById: jest.fn((_id) => ({
    id: _id,
    chainId: '0x1',
    status: 'approved',
    time: 123,
    txParams: {
      from: '0x123',
    },
    networkClientId: 'selectedNetworkClientId',
  })),
}));

/**
 * Build a mock NetworkController.
 *
 * @param partialMock - A partial mock object for the NetworkController, merged
 * with the default mock.
 * @returns A mock NetworkController.
 */
function buildControllerMock(
  partialMock?: Partial<NetworkController>,
): NetworkController {
  const defaultControllerMocks = {};

  // @ts-expect-error Incomplete mock, just includes properties used by code-under-test.
  return {
    ...defaultControllerMocks,
    ...partialMock,
  };
}

function buildInitRequestMock(
  initRequestProperties: Record<string, unknown> = {},
): jest.Mocked<
  ControllerInitRequest<
    TransactionControllerMessenger,
    TransactionControllerInitMessenger
  >
> {
  const initMessenger = new ExtendedControllerMessenger();
  const baseControllerMessenger = new ExtendedControllerMessenger();
  const requestMock = {
    ...buildControllerInitRequestMock(baseControllerMessenger),
    initMessenger:
      initMessenger as unknown as TransactionControllerInitMessenger,
    controllerMessenger:
      baseControllerMessenger as unknown as TransactionControllerMessenger,
    ...initRequestProperties,
  };

  if (!initRequestProperties.getController) {
    requestMock.getController.mockReturnValue(buildControllerMock());
  }

  return requestMock;
}

describe('Transaction Controller Init', () => {
  const transactionControllerClassMock = jest.mocked(TransactionController);
  const selectShouldUseSmartTransactionMock = jest.mocked(
    selectShouldUseSmartTransaction,
  );
  const submitSmartTransactionHookMock = jest.mocked(
    submitSmartTransactionHook,
  );
  const selectSwapsChainFeatureFlagsMock = jest.mocked(
    selectSwapsChainFeatureFlags,
  );
  const getGlobalChainIdMock = jest.mocked(getGlobalChainId);
  const handleTransactionApprovedEventForMetricsMock = jest.mocked(
    handleTransactionApprovedEventForMetrics,
  );
  const handleTransactionFinalizedEventForMetricsMock = jest.mocked(
    handleTransactionFinalizedEventForMetrics,
  );
  const handleTransactionRejectedEventForMetricsMock = jest.mocked(
    handleTransactionRejectedEventForMetrics,
  );
  const handleTransactionSubmittedEventForMetricsMock = jest.mocked(
    handleTransactionSubmittedEventForMetrics,
  );
  const handleTransactionAddedEventForMetricsMock = jest.mocked(
    handleTransactionAddedEventForMetrics,
  );
  const handleShowNotificationMock = jest.mocked(handleShowNotification);
  const getTransactionByIdMock = jest.mocked(getTransactionById);
  const submitBatchSmartTransactionHookMock = jest.mocked(
    submitBatchSmartTransactionHook,
  );

  /**
   * Extract a constructor option passed to the controller.
   *
   * @param option - The option to extract.
   * @param dependencyProperties - Any properties required on the controller dependencies.
   * @returns The extracted option.
   */
  function testConstructorOption<T extends keyof TransactionControllerOptions>(
    option: T,
    dependencyProperties: Record<string, unknown> = {},
    initRequestProperties: Record<string, unknown> = {},
  ): TransactionControllerOptions[T] {
    const requestMock = buildInitRequestMock(initRequestProperties);

    requestMock.getController.mockReturnValue(
      buildControllerMock(dependencyProperties),
    );

    TransactionControllerInit(requestMock);

    return transactionControllerClassMock.mock.calls[0][0][option];
  }

  beforeEach(() => {
    jest.resetAllMocks();
    selectShouldUseSmartTransactionMock.mockReturnValue(true);
    selectSwapsChainFeatureFlagsMock.mockReturnValue({});
    getGlobalChainIdMock.mockReturnValue('0x1');
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(TransactionControllerInit(requestMock).controller).toBeInstanceOf(
      TransactionController,
    );
  });

  it('initialize with correct state', () => {
    const MOCK_TRANSACTION_CONTROLLER_STATE = {
      transactions: [],
    };
    const state = testConstructorOption('state', undefined, {
      persistedState: {
        TransactionController: MOCK_TRANSACTION_CONTROLLER_STATE,
      },
    });

    expect(state).toBe(MOCK_TRANSACTION_CONTROLLER_STATE);
  });

  describe('throws error', () => {
    it('if requested controller is not found', () => {
      const requestMock = buildInitRequestMock({
        getController: () => {
          throw new Error('Controller not found');
        },
      });
      expect(() => TransactionControllerInit(requestMock)).toThrow(
        'Controller not found',
      );
    });

    it('if controller initialisation fails', () => {
      transactionControllerClassMock.mockImplementationOnce(() => {
        throw new Error('Controller initialisation failed');
      });
      const requestMock = buildInitRequestMock();

      expect(() => TransactionControllerInit(requestMock)).toThrow(
        'Controller initialisation failed',
      );
    });
  });

  it.each([
    [
      'networkController',
      'getEIP1559Compatibility',
      'getCurrentNetworkEIP1559Compatibility',
    ],
    ['gasFeeController', 'fetchGasFeeEstimates', 'getGasFeeEstimates'],
    [
      'networkController',
      'getNetworkClientRegistry',
      'getNetworkClientRegistry',
    ],
    ['keyringController', 'signTransaction', 'sign'],
  ])('calls %s.%s on option %s', (_controller, method, option) => {
    const mock = jest.fn();

    const optionFn = testConstructorOption(
      option as keyof TransactionControllerOptions,
      {
        [method]: mock,
      },
    ) as unknown as () => void;

    optionFn();

    expect(mock).toHaveBeenCalled();
  });

  it('calls smartTransactionsController.getTransactions on option getExternalPendingTransactions', () => {
    const MOCK_STX = [{ id: '123' }];
    const MOCK_ADDRESS = '0x123';
    const getTransactionsMock = jest.fn().mockReturnValue(MOCK_STX);

    const optionFn = testConstructorOption('getExternalPendingTransactions', {
      getTransactions: getTransactionsMock,
    });

    optionFn?.(MOCK_ADDRESS);

    expect(getTransactionsMock).toHaveBeenCalledWith({
      addressFrom: MOCK_ADDRESS,
      status: SmartTransactionStatuses.PENDING,
    });
  });

  it('determines if simulation enabled using preference', () => {
    const optionFn = testConstructorOption('isSimulationEnabled', {
      state: {
        useTransactionSimulations: true,
      },
    });

    expect(optionFn?.()).toBe(true);
  });

  it('determines if resubmit enabled for pending transactions', () => {
    const optionFn = testConstructorOption(
      'pendingTransactions',
    )?.isResubmitEnabled;

    expect(optionFn?.()).toBe(false);
  });

  it('publish hook calls submitSmartTransactionHook', () => {
    const MOCK_TRANSACTION_META = {
      id: '123',
      chainId: '0x1',
      status: 'approved',
      time: 123,
      txParams: {
        from: '0x123',
      },
      networkClientId: 'selectedNetworkClientId',
    } as TransactionMeta;

    const hooks = testConstructorOption('hooks');

    hooks?.publish?.(MOCK_TRANSACTION_META);

    expect(submitSmartTransactionHookMock).toHaveBeenCalledTimes(1);
    expect(selectShouldUseSmartTransactionMock).toHaveBeenCalledTimes(1);
    expect(selectShouldUseSmartTransactionMock).toHaveBeenCalledWith(
      undefined,
      MOCK_TRANSACTION_META.chainId,
    );
    expect(selectSwapsChainFeatureFlagsMock).toHaveBeenCalledTimes(1);
    expect(submitSmartTransactionHookMock).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionMeta: MOCK_TRANSACTION_META,
        shouldUseSmartTransaction: true,
      }),
    );
  });

  it('publishBatch hook calls submitBatchSmartTransactionHook', () => {
    const mockTransactionMeta = {
      id: '123',
      chainId: '0x1',
      status: 'approved',
      time: 123,
      txParams: {
        from: '0x123',
      },
      networkClientId: 'selectedNetworkClientId',
    };

    getTransactionByIdMock.mockReturnValue(
      mockTransactionMeta as TransactionMeta,
    );

    selectShouldUseSmartTransactionMock.mockReturnValue(true);

    submitBatchSmartTransactionHookMock.mockResolvedValue({
      results: [{ transactionHash: '0xhash' }],
    });

    const hooks = testConstructorOption('hooks');

    const mockTransactions = [
      {
        id: '123',
        signedTx: '0x1234' as Hex,
      },
    ];

    hooks?.publishBatch?.({
      transactions:
        mockTransactions as unknown as PublishBatchHookTransaction[],
      from: '0x123',
      networkClientId: 'selectedNetworkClientId',
    });

    expect(submitBatchSmartTransactionHookMock).toHaveBeenCalled();

    expect(submitBatchSmartTransactionHookMock).toHaveBeenCalledWith(
      expect.objectContaining({
        transactions: mockTransactions,
        shouldUseSmartTransaction: true,
      }),
    );
  });

  describe('publishBatch hook', () => {
    const mockBatchTransactions = [
      { id: '122', signedTx: '0x1111' as Hex },
      { id: '123', signedTx: '0x2222' as Hex },
    ] as unknown as PublishBatchHookTransaction[];

    function callPublishBatch() {
      const hooks = testConstructorOption('hooks');
      return hooks?.publishBatch?.({
        transactions: mockBatchTransactions,
        from: '0x123',
        networkClientId: 'selectedNetworkClientId',
      });
    }

    it('rejects if the last transaction cannot be found', async () => {
      getTransactionByIdMock.mockReturnValue(undefined);

      await expect(callPublishBatch()).rejects.toThrow(
        'publishBatchSmartTransactionHook: Could not find transaction with id 123',
      );
      expect(getTransactionByIdMock).toHaveBeenCalledWith(
        '123',
        expect.anything(),
      );
      expect(submitBatchSmartTransactionHookMock).not.toHaveBeenCalled();
    });

    it('rejects if smart transactions are not enabled for the chain', async () => {
      getTransactionByIdMock.mockReturnValue({
        id: '123',
        chainId: '0x5',
        status: 'approved',
        time: 123,
        txParams: { from: '0x123' },
        networkClientId: 'selectedNetworkClientId',
      } as TransactionMeta);
      selectShouldUseSmartTransactionMock.mockReturnValue(false);

      await expect(callPublishBatch()).rejects.toThrow(
        'publishBatchSmartTransactionHook: Smart Transaction is required for batch submissions',
      );
      expect(selectShouldUseSmartTransactionMock).toHaveBeenCalledWith(
        undefined,
        '0x5',
      );
      expect(submitBatchSmartTransactionHookMock).not.toHaveBeenCalled();
    });
  });

  it('determines incoming transactions based on preferences', () => {
    const MOCK_CHAIN_ID = '0x1';
    const option = testConstructorOption(
      'incomingTransactions',
      {
        state: {
          showIncomingTransactions: {
            [MOCK_CHAIN_ID]: true,
          },
        },
      },
      {
        getGlobalChainId: () => MOCK_CHAIN_ID,
      },
    );

    const isEnabledFn = option?.isEnabled;
    const updateTransactionsProp = option?.updateTransactions;

    expect(isEnabledFn?.()).toBe(true);
    expect(updateTransactionsProp).toBe(true);
  });

  it.each([
    ['current chain is not in preferences', { '0x5': true }, '0x1'],
    ['current chain preference is false', { '0x1': false }, '0x1'],
    ['preferences are empty', {}, '0x1'],
  ])(
    'disables incoming transactions if %s',
    (_title, showIncomingTransactions, currentChainId) => {
      const option = testConstructorOption(
        'incomingTransactions',
        {
          state: {
            showIncomingTransactions,
          },
        },
        {
          getGlobalChainId: () => currentChainId,
        },
      );

      expect(option?.isEnabled?.()).toBe(false);
    },
  );

  it('determines if automatic gas fee update is enabled based on transaction type', () => {
    const option = testConstructorOption('isAutomaticGasFeeUpdateEnabled');
    const isEnabledFn = option as ({ type }: { type: string }) => boolean;

    // Redesigned transaction types
    expect(isEnabledFn({ type: TransactionType.stakingDeposit })).toBe(true);
    expect(isEnabledFn({ type: TransactionType.stakingUnstake })).toBe(true);
    expect(isEnabledFn({ type: TransactionType.stakingClaim })).toBe(true);
    expect(isEnabledFn({ type: TransactionType.contractInteraction })).toBe(
      true,
    );

    // Non-redesigned transaction types
    expect(isEnabledFn({ type: TransactionType.bridge })).toBe(false);
  });

  it('gets network state from network controller on option getNetworkState', () => {
    const MOCK_NETWORK_STATE = {
      chainId: '0x1',
    };
    const option = testConstructorOption('getNetworkState', {
      state: {
        ...MOCK_NETWORK_STATE,
      },
    });

    expect(option?.()).toStrictEqual(MOCK_NETWORK_STATE);
  });

  it('calls appropriate handlers when transaction events are triggered', () => {
    const mockSubscribe = jest.fn();
    const subscribeCallbacks: Record<string, ((...args: unknown[]) => void)[]> =
      {};

    mockSubscribe.mockImplementation((eventName, callback) => {
      subscribeCallbacks[eventName] = [
        ...(subscribeCallbacks[eventName] ?? []),
        callback,
      ];
    });

    const requestMock = buildInitRequestMock({
      initMessenger: {
        subscribe: mockSubscribe,
      },
      getState: () => ({ confirmationMetrics: { metricsById: {} } }),
    });

    TransactionControllerInit(requestMock);

    const mockTransactionMeta = {
      id: '123',
      status: 'approved',
    } as TransactionMeta;

    const handlerContext = {
      getState: expect.any(Function),
      initMessenger: expect.any(Object),
      smartTransactionsController: expect.any(Object),
    };

    const eventHandlerMap = [
      {
        event: 'TransactionController:transactionApproved',
        handler: handleShowNotificationMock,
        payload: { transactionMeta: mockTransactionMeta },
        expectedArgs: [mockTransactionMeta],
      },
      {
        event: 'TransactionController:transactionApproved',
        handler: handleTransactionApprovedEventForMetricsMock,
        payload: { transactionMeta: mockTransactionMeta },
        expectedArgs: [mockTransactionMeta, handlerContext],
      },
      {
        event: 'TransactionController:transactionConfirmed',
        handler: handleTransactionFinalizedEventForMetricsMock,
        payload: mockTransactionMeta,
        expectedArgs: [mockTransactionMeta, handlerContext],
      },
      {
        event: 'TransactionController:transactionDropped',
        handler: handleTransactionFinalizedEventForMetricsMock,
        payload: { transactionMeta: mockTransactionMeta },
        expectedArgs: [mockTransactionMeta, handlerContext],
      },
      {
        event: 'TransactionController:transactionFailed',
        handler: handleTransactionFinalizedEventForMetricsMock,
        payload: { transactionMeta: mockTransactionMeta },
        expectedArgs: [mockTransactionMeta, handlerContext],
      },
      {
        event: 'TransactionController:transactionRejected',
        handler: handleTransactionRejectedEventForMetricsMock,
        payload: { transactionMeta: mockTransactionMeta },
        expectedArgs: [mockTransactionMeta, handlerContext],
      },
      {
        event: 'TransactionController:transactionSubmitted',
        handler: handleTransactionSubmittedEventForMetricsMock,
        payload: { transactionMeta: mockTransactionMeta },
        expectedArgs: [mockTransactionMeta, handlerContext],
      },
      {
        event: 'TransactionController:unapprovedTransactionAdded',
        handler: handleTransactionAddedEventForMetricsMock,
        payload: mockTransactionMeta,
        expectedArgs: [mockTransactionMeta, handlerContext],
      },
    ];

    expect(mockSubscribe).toHaveBeenCalledTimes(eventHandlerMap.length);

    eventHandlerMap.forEach(({ event, handler, payload, expectedArgs }) => {
      jest.clearAllMocks();
      subscribeCallbacks[event].forEach((callback) => callback(payload));
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(...expectedArgs);
    });
  });
});
