import React from 'react';
import { Alert } from 'react-native';
import { act, render } from '@testing-library/react-native';
import configureMockStore, { MockStoreEnhanced } from 'redux-mock-store';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Approval from './index';
import TransactionEditor from './components/TransactionEditor';
import { ThemeContext, mockTheme } from '../../../../../util/theme';
import initialRootState from '../../../../../util/test/initial-root-state';
import Engine from '../../../../../core/Engine';
import NotificationManager from '../../../../../core/NotificationManager';
import Logger from '../../../../../util/Logger';
import {
  isHardwareAccount,
  isQRHardwareAccount,
} from '../../../../../util/address';
import { getDeviceId } from '../../../../../core/Ledger/Ledger';
import { updateTransaction } from '../../../../../util/transaction-controller';
import { MetaMetricsEvents } from '../../../../../core/Analytics';
import Routes from '../../../../../constants/navigation/Routes';
import { KEYSTONE_TX_CANCELED } from '../../../../../constants/error';
import { STX_NO_HASH_ERROR } from '../../../../../util/smart-transactions/smart-publish-hook';

const TRANSACTION_ID_MOCK = '123';
const mockTrackEvent = jest.fn();
let mockShouldUseSmartTransaction = false;
let mockTransactionMetadata: Record<string, unknown> | null = null;
let mockStubTransactionEditor = false;

jest.mock('./components/TransactionEditor', () => {
  const { default: ActualTransactionEditor } = jest.requireActual(
    './components/TransactionEditor',
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockTransactionEditor = (props: any) =>
    mockStubTransactionEditor ? null : <ActualTransactionEditor {...props} />;
  return { __esModule: true, default: MockTransactionEditor };
});

jest.mock('../../../../../components/hooks/useMetrics', () => {
  const { MetricsEventBuilder: MockMetricsEventBuilder } = jest.requireActual(
    '../../../../../core/Analytics/MetricsEventBuilder',
  );
  return {
    ...jest.requireActual('../../../../../components/hooks/useMetrics'),
    withMetricsAwareness:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Children: React.ComponentType<any>) => (props: any) =>
        (
          <Children
            {...props}
            metrics={{
              trackEvent: mockTrackEvent,
              createEventBuilder: MockMetricsEventBuilder.createEventBuilder,
            }}
          />
        ),
  };
});

jest.mock('../../../../../util/address', () => {
  const actual = jest.requireActual('../../../../../util/address');
  return {
    ...actual,
    isHardwareAccount: jest.fn(actual.isHardwareAccount),
    isQRHardwareAccount: jest.fn(actual.isQRHardwareAccount),
  };
});

jest.mock('../../../../../core/Ledger/Ledger', () => ({
  ...jest.requireActual('../../../../../core/Ledger/Ledger'),
  getDeviceId: jest.fn(),
}));

jest.mock('../../../../../util/transaction-controller', () => ({
  ...jest.requireActual('../../../../../util/transaction-controller'),
  updateTransaction: jest.fn(),
}));

jest.mock('../../../../../core/SDKConnect/SDKConnect', () => {
  const mockSDKConnect = {
    getInstance: () => ({
      getConnection: () => undefined,
      getConnections: () => ({}),
    }),
  };
  return {
    __esModule: true,
    SDKConnect: mockSDKConnect,
    default: mockSDKConnect,
  };
});

jest.mock('../../../../../core/WalletConnect/WalletConnectV2', () => ({
  __esModule: true,
  default: {
    getInstance: () => Promise.resolve({ getSessions: () => [] }),
  },
}));

jest.mock('../../../../../selectors/smartTransactionsController', () => ({
  selectSmartTransactionsEnabled: () => false,
  selectShouldUseSmartTransaction: () => mockShouldUseSmartTransaction,
  selectPendingSmartTransactionsBySender: () => [],
}));

jest.mock('../../../../../selectors/preferencesController', () => ({
  selectSmartTransactionsBannerDismissed: () => false,
  selectSmartTransactionsMigrationApplied: () => false,
  selectSmartTransactionsOptInStatus: () => false,
  selectUseTransactionSimulations: () => false,
  selectIsTokenNetworkFilterEqualCurrentNetwork: () => true,
}));

jest.mock('../../../../../util/dappTransactions', () => ({
  handleGetGasLimit: jest.fn(),
}));

jest.mock('../../../../../core/Engine', () => ({
  rejectPendingApproval: jest.fn(),
  context: {
    KeyringController: {
      resetQRKeyringState: jest.fn(),
      getOrAddQRKeyring: jest.fn(),
      cancelQRSignRequest: jest.fn(),
    },
    ApprovalController: {
      accept: jest.fn(),
    },
    TransactionController: {
      getTransactions: jest.fn().mockReturnValue([]),
    },
    GasFeeController: {
      getGasFeeEstimatesAndStartPolling: jest.fn().mockResolvedValue(null),
      stopPolling: jest.fn(),
    },
  },
  controllerMessenger: {
    tryUnsubscribe: jest.fn(),
    subscribe: jest.fn(),
    subscribeOnceIf: jest.fn(),
    unsubscribe: jest.fn(),
  },
}));

jest.mock('../../../../../selectors/confirmTransaction', () => ({
  selectCurrentTransactionSecurityAlertResponse: () => null,
  selectCurrentTransactionMetadata: () => mockTransactionMetadata,
  selectGasFeeEstimates: () => ({}),
}));

jest.mock('../../../../../selectors/tokenListController', () => ({
  selectTokenList: () => ({}),
}));

const Stack = createStackNavigator();
const mockStore = configureMockStore();
const navigationPropMock = {
  setOptions: jest.fn(),
  setParams: jest.fn(),
  navigate: jest.fn(),
};
const routeMock = {
  params: {},
};

const renderComponent = ({
  store,
  hideModal,
}: {
  store: Store;
  hideModal?: jest.Mock;
}) =>
  render(
    <Provider store={store}>
      <ThemeContext.Provider value={mockTheme}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Approval">
              {() => (
                <Approval
                  dappTransactionModalVisible
                  hideModal={hideModal}
                  navigation={navigationPropMock}
                  route={routeMock}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeContext.Provider>
    </Provider>,
  );

describe('Approval', () => {
  let store: Store;

  beforeEach(() => {
    jest.clearAllMocks();
    store = mockStore({
      ...initialRootState,
      settings: {
        showCustomNonce: false,
      },
      transaction: {
        id: TRANSACTION_ID_MOCK,
        from: '0x1234',
        transaction: {
          data: '0x1',
        },
      },
      browser: {
        tabs: [],
      },
      alert: {
        isVisible: false,
      },
    });
  });

  it('render matches snapshot', () => {
    const wrapper = renderComponent({ store });
    expect(wrapper).toMatchSnapshot();
  });
});

describe('Approval confirm flow', () => {
  const FROM_ADDRESS_MOCK = '0x0000000000000000000000000000000000000001';
  const TO_ADDRESS_MOCK = '0x0000000000000000000000000000000000000002';
  const DEVICE_ID_MOCK = 'ledger-device-id';
  const LISTENER_MOCK = { listener: 'transactionFinished' };
  const CONFIRM_ARGS_MOCK = {
    gasEstimateType: 'fee-market',
    EIP1559GasData: {},
    gasSelected: 'medium',
  };

  const mockEngine = jest.mocked(Engine);
  const mockSubscribeOnceIf = mockEngine.controllerMessenger
    .subscribeOnceIf as unknown as jest.Mock;
  const mockTryUnsubscribe = mockEngine.controllerMessenger
    .tryUnsubscribe as unknown as jest.Mock;
  const mockAccept = mockEngine.context.ApprovalController
    .accept as unknown as jest.Mock;
  const mockCancelQRSignRequest = mockEngine.context.KeyringController
    .cancelQRSignRequest as unknown as jest.Mock;
  const mockRejectPendingApproval =
    mockEngine.rejectPendingApproval as unknown as jest.Mock;
  const mockIsHardwareAccount = jest.mocked(isHardwareAccount);
  const mockIsQRHardwareAccount = jest.mocked(isQRHardwareAccount);
  const mockGetDeviceId = jest.mocked(getDeviceId);
  const mockUpdateTransaction = jest.mocked(updateTransaction);

  let store: MockStoreEnhanced<unknown>;
  let hideModal: jest.Mock;
  let alertSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;
  let watchSubmittedTransactionSpy: jest.SpyInstance;

  const createStore = () =>
    mockStore({
      ...initialRootState,
      engine: {
        ...initialRootState.engine,
        backgroundState: {
          ...initialRootState.engine.backgroundState,
          TransactionController: {
            ...initialRootState.engine.backgroundState.TransactionController,
            transactions: [
              {
                id: TRANSACTION_ID_MOCK,
                chainId: '0x1',
                status: 'unapproved',
                txParams: {
                  from: FROM_ADDRESS_MOCK,
                  to: TO_ADDRESS_MOCK,
                  type: '0x2',
                },
              },
            ],
          },
        },
      },
      settings: {
        showCustomNonce: false,
      },
      transaction: {
        id: TRANSACTION_ID_MOCK,
        origin: 'https://metamask.github.io',
        assetType: 'ETH',
        selectedAsset: { symbol: 'ETH', isETH: true },
        transaction: {
          from: FROM_ADDRESS_MOCK,
          to: TO_ADDRESS_MOCK,
          data: '0x1',
          value: '0x0',
        },
      },
      browser: {
        tabs: [],
      },
      alert: {
        isVisible: false,
      },
    });

  const renderApproval = () => renderComponent({ store, hideModal });

  const confirm = async (wrapper: ReturnType<typeof renderApproval>) => {
    const { onConfirm } = wrapper.UNSAFE_getByType(TransactionEditor).props;
    await act(async () => {
      await onConfirm(CONFIRM_ARGS_MOCK);
    });
  };

  const getTransactionFinishedSubscription = () => {
    expect(mockSubscribeOnceIf).toHaveBeenCalledTimes(1);
    const [eventName, handler, predicate] = mockSubscribeOnceIf.mock.calls[0];
    expect(eventName).toBe('TransactionController:transactionFinished');
    return { handler, predicate };
  };

  const trackedEventNames = () =>
    mockTrackEvent.mock.calls.map(([event]) => event.name);

  const mockLedgerAccount = () =>
    mockIsHardwareAccount.mockImplementation(
      (_address, accountTypes) =>
        accountTypes?.length === 1 && accountTypes[0] === 'Ledger Hardware',
    );

  beforeEach(() => {
    jest.clearAllMocks();
    mockShouldUseSmartTransaction = false;
    mockTransactionMetadata = null;
    mockStubTransactionEditor = true;
    mockIsHardwareAccount.mockReturnValue(false);
    mockIsQRHardwareAccount.mockReturnValue(false);
    mockSubscribeOnceIf.mockReturnValue(LISTENER_MOCK);
    mockAccept.mockResolvedValue({});
    mockUpdateTransaction.mockResolvedValue(undefined as never);
    mockGetDeviceId.mockResolvedValue(DEVICE_ID_MOCK);
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    loggerErrorSpy = jest.spyOn(Logger, 'error').mockImplementation(jest.fn());
    watchSubmittedTransactionSpy = jest
      .spyOn(NotificationManager, 'watchSubmittedTransaction')
      .mockImplementation(jest.fn());
    hideModal = jest.fn();
    store = createStore();
  });

  afterEach(() => {
    mockStubTransactionEditor = false;
    alertSpy.mockRestore();
    loggerErrorSpy.mockRestore();
    watchSubmittedTransactionSpy.mockRestore();
  });

  describe('transactionFinished listener', () => {
    it('subscribes once, filtered to the confirmed transaction id', async () => {
      const wrapper = renderApproval();
      await confirm(wrapper);

      const { predicate } = getTransactionFinishedSubscription();
      expect(predicate({ id: TRANSACTION_ID_MOCK })).toBe(true);
      expect(predicate({ id: 'other-id' })).toBe(false);
    });

    it('updates the transaction then accepts the approval and waits for the result', async () => {
      const wrapper = renderApproval();
      await confirm(wrapper);

      expect(mockUpdateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: TRANSACTION_ID_MOCK,
          txParams: expect.not.objectContaining({
            gasPrice: expect.anything(),
          }),
        }),
      );
      expect(mockAccept).toHaveBeenCalledWith(TRANSACTION_ID_MOCK, undefined, {
        waitForResult: true,
      });
      expect(mockUpdateTransaction.mock.invocationCallOrder[0]).toBeLessThan(
        mockAccept.mock.invocationCallOrder[0],
      );
      expect(trackedEventNames()).toContain(
        MetaMetricsEvents.DAPP_TRANSACTION_COMPLETED.category,
      );
    });

    it('does not hide the modal before the transaction is finished', async () => {
      const wrapper = renderApproval();
      await confirm(wrapper);

      expect(hideModal).not.toHaveBeenCalled();
    });

    it('hides the modal and watches the transaction when status is submitted', async () => {
      const wrapper = renderApproval();
      await confirm(wrapper);
      const { handler } = getTransactionFinishedSubscription();

      const transactionMeta = {
        id: TRANSACTION_ID_MOCK,
        status: 'submitted',
        hash: '0xabc',
      };
      act(() => handler(transactionMeta));

      expect(hideModal).toHaveBeenCalledTimes(1);
      expect(watchSubmittedTransactionSpy).toHaveBeenCalledWith({
        ...transactionMeta,
        assetType: 'ETH',
      });
      expect(loggerErrorSpy).not.toHaveBeenCalledWith(
        expect.anything(),
        'error while trying to finish a transaction (Approval)',
      );
    });

    it('logs the error and keeps the modal open when status is failed', async () => {
      const wrapper = renderApproval();
      await confirm(wrapper);
      const { handler } = getTransactionFinishedSubscription();

      const error = new Error('execution reverted');
      act(() => handler({ id: TRANSACTION_ID_MOCK, status: 'failed', error }));

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        error,
        'error while trying to finish a transaction (Approval)',
      );
      expect(hideModal).not.toHaveBeenCalled();
      expect(watchSubmittedTransactionSpy).not.toHaveBeenCalled();
    });

    it('does not reject the approval on unmount once the transaction was submitted', async () => {
      const wrapper = renderApproval();
      await confirm(wrapper);
      const { handler } = getTransactionFinishedSubscription();
      act(() => handler({ id: TRANSACTION_ID_MOCK, status: 'submitted' }));

      wrapper.unmount();

      expect(mockRejectPendingApproval).not.toHaveBeenCalled();
      expect(mockTryUnsubscribe).not.toHaveBeenCalled();
    });
  });

  describe('smart transactions', () => {
    it('hides the modal before accepting when smart transactions are enabled', async () => {
      mockShouldUseSmartTransaction = true;
      const wrapper = renderApproval();
      await confirm(wrapper);

      expect(hideModal).toHaveBeenCalledTimes(1);
      expect(hideModal.mock.invocationCallOrder[0]).toBeLessThan(
        mockAccept.mock.invocationCallOrder[0],
      );
      expect(mockAccept).toHaveBeenCalledWith(TRANSACTION_ID_MOCK, undefined, {
        waitForResult: true,
      });
    });

    it('does not reject the approval on unmount when smart transactions are enabled', async () => {
      mockShouldUseSmartTransaction = true;
      const wrapper = renderApproval();
      await confirm(wrapper);

      wrapper.unmount();

      expect(mockRejectPendingApproval).not.toHaveBeenCalled();
    });

    it('does not show an error alert for the STX no-hash error', async () => {
      mockShouldUseSmartTransaction = true;
      mockAccept.mockRejectedValue(new Error(STX_NO_HASH_ERROR));
      const wrapper = renderApproval();
      await confirm(wrapper);

      expect(alertSpy).not.toHaveBeenCalled();
      expect(loggerErrorSpy).not.toHaveBeenCalledWith(
        expect.anything(),
        'error while trying to send transaction (Approval)',
      );
      expect(trackedEventNames()).toContain(
        MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED.category,
      );
    });
  });

  describe('ledger accounts', () => {
    beforeEach(() => {
      mockLedgerAccount();
    });

    it('hands off signing to the ledger modal instead of accepting', async () => {
      const navigation = navigationPropMock;
      const wrapper = renderApproval();
      await confirm(wrapper);

      expect(mockGetDeviceId).toHaveBeenCalled();
      expect(navigation.navigate).toHaveBeenCalledWith(
        Routes.LEDGER_TRANSACTION_MODAL,
        expect.objectContaining({
          transactionId: TRANSACTION_ID_MOCK,
          deviceId: DEVICE_ID_MOCK,
          type: 'signTransaction',
          onConfirmationComplete: expect.any(Function),
        }),
      );
      expect(hideModal).toHaveBeenCalledTimes(1);
      expect(mockAccept).not.toHaveBeenCalled();
    });

    it('watches the submitted transaction without hiding the modal again', async () => {
      const wrapper = renderApproval();
      await confirm(wrapper);
      hideModal.mockClear();
      const { handler } = getTransactionFinishedSubscription();

      act(() => handler({ id: TRANSACTION_ID_MOCK, status: 'submitted' }));

      expect(hideModal).not.toHaveBeenCalled();
      expect(watchSubmittedTransactionSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: TRANSACTION_ID_MOCK, assetType: 'ETH' }),
      );
    });

    it('unsubscribes and tracks cancel + completed when the ledger confirmation is rejected', async () => {
      const wrapper = renderApproval();
      await confirm(wrapper);
      const { onConfirmationComplete } =
        navigationPropMock.navigate.mock.calls[0][1];
      mockTrackEvent.mockClear();

      onConfirmationComplete(false);

      expect(mockTryUnsubscribe).toHaveBeenCalledWith(
        'TransactionController:transactionFinished',
        LISTENER_MOCK,
      );
      expect(trackedEventNames()).toEqual([
        MetaMetricsEvents.DAPP_TRANSACTION_CANCELLED.category,
        MetaMetricsEvents.DAPP_TRANSACTION_COMPLETED.category,
      ]);
    });

    it('keeps the listener and tracks only completed when the ledger confirmation is approved', async () => {
      const wrapper = renderApproval();
      await confirm(wrapper);
      const { onConfirmationComplete } =
        navigationPropMock.navigate.mock.calls[0][1];
      mockTrackEvent.mockClear();

      onConfirmationComplete(true);

      expect(mockTryUnsubscribe).not.toHaveBeenCalled();
      expect(trackedEventNames()).toEqual([
        MetaMetricsEvents.DAPP_TRANSACTION_COMPLETED.category,
      ]);
    });

    it('does not reject the approval on unmount after the ledger handoff', async () => {
      const wrapper = renderApproval();
      await confirm(wrapper);

      wrapper.unmount();

      expect(mockRejectPendingApproval).not.toHaveBeenCalled();
    });
  });

  describe('errors', () => {
    it('alerts, logs and hides the modal when accept throws', async () => {
      const error = new Error('Something went wrong');
      mockAccept.mockRejectedValue(error);
      const wrapper = renderApproval();
      await confirm(wrapper);

      expect(alertSpy).toHaveBeenCalledWith(
        expect.any(String),
        error.message,
        expect.any(Array),
      );
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        error,
        'error while trying to send transaction (Approval)',
      );
      expect(hideModal).toHaveBeenCalledTimes(1);
      expect(trackedEventNames()).toContain(
        MetaMetricsEvents.DAPP_TRANSACTION_COMPLETED.category,
      );
    });

    it('rejects the pending approval on unmount after accept throws', async () => {
      mockAccept.mockRejectedValue(new Error('Something went wrong'));
      const wrapper = renderApproval();
      await confirm(wrapper);

      wrapper.unmount();

      expect(mockRejectPendingApproval).toHaveBeenCalledWith(
        TRANSACTION_ID_MOCK,
        expect.objectContaining({ code: 4001 }),
        { ignoreMissing: true, logErrors: false },
      );
      expect(mockTryUnsubscribe).toHaveBeenCalledWith(
        'TransactionController:transactionFinished',
        LISTENER_MOCK,
      );
    });

    it('tracks a QR cancel instead of alerting when the Keystone request is cancelled', async () => {
      mockAccept.mockRejectedValue(new Error(KEYSTONE_TX_CANCELED));
      const wrapper = renderApproval();
      await confirm(wrapper);

      expect(alertSpy).not.toHaveBeenCalled();
      expect(hideModal).not.toHaveBeenCalled();
      expect(trackedEventNames()).toContain(
        MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED.category,
      );
    });
  });

  describe('simulation changed after security check', () => {
    it('opens the change-in-simulation modal instead of confirming', async () => {
      mockTransactionMetadata = {
        simulationData: { isUpdatedAfterSecurityCheck: true },
      };
      const wrapper = renderApproval();
      await confirm(wrapper);

      expect(navigationPropMock.navigate).toHaveBeenCalledWith(
        Routes.MODAL.ROOT_MODAL_FLOW,
        expect.objectContaining({
          screen: Routes.SHEET.CHANGE_IN_SIMULATION_MODAL,
        }),
      );
      expect(mockSubscribeOnceIf).not.toHaveBeenCalled();
      expect(mockAccept).not.toHaveBeenCalled();
    });
  });

  describe('unmount', () => {
    it('rejects the pending approval and unsubscribes when the transaction was not handled', () => {
      const wrapper = renderApproval();

      wrapper.unmount();

      expect(mockRejectPendingApproval).toHaveBeenCalledWith(
        TRANSACTION_ID_MOCK,
        expect.objectContaining({ code: 4001 }),
        { ignoreMissing: true, logErrors: false },
      );
      expect(mockCancelQRSignRequest).not.toHaveBeenCalled();
      expect(mockTryUnsubscribe).toHaveBeenCalledWith(
        'TransactionController:transactionFinished',
        undefined,
      );
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'RESET_TRANSACTION' }),
      );
    });

    it('cancels the QR sign request instead of rejecting for QR hardware accounts', () => {
      mockIsQRHardwareAccount.mockReturnValue(true);
      const wrapper = renderApproval();

      wrapper.unmount();

      expect(mockCancelQRSignRequest).toHaveBeenCalledTimes(1);
      expect(mockRejectPendingApproval).not.toHaveBeenCalled();
      expect(mockTryUnsubscribe).toHaveBeenCalled();
    });
  });
});
