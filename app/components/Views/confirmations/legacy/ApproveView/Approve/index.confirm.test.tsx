import React from 'react';
import { Alert } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import { merge } from 'lodash';
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import { providerErrors } from '@metamask/rpc-errors';

import Approve from './index';
import { ThemeContext, mockTheme } from '../../../../../../util/theme';
import initialRootState from '../../../../../../util/test/initial-root-state';
import Routes from '../../../../../../constants/navigation/Routes';
import Engine from '../../../../../../core/Engine';
import NotificationManager from '../../../../../../core/NotificationManager';
import Logger from '../../../../../../util/Logger';
import { isHardwareAccount } from '../../../../../../util/address';
import { updateTransaction } from '../../../../../../util/transaction-controller';
import { getDeviceId } from '../../../../../../core/Ledger/Ledger';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
import { STX_NO_HASH_ERROR } from '../../../../../../util/smart-transactions/smart-publish-hook';

const TRANSACTION_ID_MOCK = 'approve-tx-id';
const CHAIN_ID_MOCK = '0x1';
const FROM_MOCK = '0xc4955c0d639d99699bfd7ec54d9fafee40e4d272';
const FROM_CHECKSUM_MOCK = '0xC4955C0d639D99699Bfd7Ec54d9FaFEe40e4D272';
const TO_MOCK = '0x6b175474e89094c44da98b954eedeac495271d0f';
const SUBSCRIPTION_MOCK = 'transaction-finished-subscription';
const BALANCE_MOCK = '0x3e8'; // 1000 wei
const AFFORDABLE_TOTAL_MOCK = '0x64'; // 100 wei
const UNAFFORDABLE_TOTAL_MOCK = '0x2710'; // 10000 wei
const LEGACY_GAS_MOCK = {
  totalHex: AFFORDABLE_TOTAL_MOCK,
  suggestedGasLimitHex: '5208',
  suggestedGasPriceHex: '1',
};
const EIP1559_GAS_MOCK = {
  totalMaxHex: AFFORDABLE_TOTAL_MOCK,
  gasLimitHex: '5208',
  suggestedMaxFeePerGasHex: '2',
  suggestedMaxPriorityFeePerGasHex: '1',
  estimatedBaseFeeHex: '1',
};

let mockShouldUseSmartTransaction = false;
interface ReviewPropsMock {
  onConfirm: () => Promise<void>;
  updateTransactionState: (gas: Record<string, string>) => void;
  gasError?: string;
  transactionConfirmed?: boolean;
}

interface EventBuilderMock {
  addProperties: jest.Mock;
  build: jest.Mock;
}

let mockReviewProps = {} as ReviewPropsMock;

const mockTrackEvent = jest.fn();
const mockCreateEventBuilder = jest.fn((event) => {
  const builder: EventBuilderMock = {
    addProperties: jest.fn(() => builder),
    build: jest.fn(() => ({ event })),
  };
  return builder;
});

jest.mock('../../../../../../selectors/smartTransactionsController', () => ({
  selectSmartTransactionsEnabled: () => false,
  selectShouldUseSmartTransaction: () => mockShouldUseSmartTransaction,
  selectPendingSmartTransactionsBySender: () => [],
}));

jest.mock('../../../../../../components/hooks/useMetrics', () => {
  const ReactActual = jest.requireActual('react');
  return {
    ...jest.requireActual('../../../../../../components/hooks/useMetrics'),
    withMetricsAwareness:
      (Component: React.ComponentType<Record<string, unknown>>) =>
      (props: Record<string, unknown>) =>
        ReactActual.createElement(Component, {
          ...props,
          metrics: {
            trackEvent: mockTrackEvent,
            createEventBuilder: mockCreateEventBuilder,
          },
        }),
  };
});

jest.mock('../../components/ApproveTransactionReview', () => {
  const { View } = jest.requireActual('react-native');
  const ReactActual = jest.requireActual('react');
  return (props: Record<string, unknown>) => {
    mockReviewProps = props as unknown as ReviewPropsMock;
    return ReactActual.createElement(View, { testID: 'approve-review' });
  };
});

jest.mock('../../../../../UI/GlobalAlert', () => () => null);

jest.mock('../../../../../../core/GasPolling/GasPolling', () => ({
  startGasPolling: jest.fn().mockResolvedValue('poll-token'),
  stopGasPolling: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../../../../util/custom-gas', () => ({
  ...jest.requireActual('../../../../../../util/custom-gas'),
  getGasLimit: jest.fn().mockResolvedValue({ gas: undefined }),
}));

jest.mock('../../../../../../util/address', () => ({
  ...jest.requireActual('../../../../../../util/address'),
  isHardwareAccount: jest.fn(),
}));

jest.mock('../../../../../../util/transaction-controller', () => ({
  ...jest.requireActual('../../../../../../util/transaction-controller'),
  updateTransaction: jest.fn(),
  getNetworkNonce: jest.fn(),
}));

jest.mock('../../../../../../core/Ledger/Ledger', () => ({
  getDeviceId: jest.fn(),
}));

jest.mock('../../../../../../core/NotificationManager', () => ({
  watchSubmittedTransaction: jest.fn(),
  showSimpleNotification: jest.fn(),
}));

jest.mock('../../../../../../util/Logger', () => ({
  error: jest.fn(),
  log: jest.fn(),
}));

jest.mock('../../../../../../core/Engine', () => ({
  controllerMessenger: {
    subscribeOnceIf: jest.fn(),
    tryUnsubscribe: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
  rejectPendingApproval: jest.fn(),
  context: {
    ApprovalController: { accept: jest.fn() },
    KeyringController: { resetQRKeyringState: jest.fn() },
  },
}));

const mockEngine = Engine as unknown as {
  controllerMessenger: {
    subscribeOnceIf: jest.Mock;
    tryUnsubscribe: jest.Mock;
  };
  rejectPendingApproval: jest.Mock;
  context: {
    ApprovalController: { accept: jest.Mock };
    KeyringController: { resetQRKeyringState: jest.Mock };
  };
};
const isHardwareAccountMock = jest.mocked(isHardwareAccount);
const updateTransactionMock = jest.mocked(updateTransaction);
const getDeviceIdMock = jest.mocked(getDeviceId);
const loggerErrorMock = jest.mocked(Logger.error);
const watchSubmittedTransactionMock = jest.mocked(
  NotificationManager.watchSubmittedTransaction,
);

const mockStore = configureMockStore();
const navigationMock = { navigate: jest.fn(), setOptions: jest.fn() };
const hideModalMock = jest.fn();

const buildState = ({
  gasEstimateType = GAS_ESTIMATE_TYPES.LEGACY,
}: { gasEstimateType?: string } = {}) =>
  merge({}, initialRootState, {
    transaction: {
      id: TRANSACTION_ID_MOCK,
      chainId: CHAIN_ID_MOCK,
      transaction: {
        from: FROM_MOCK,
        to: TO_MOCK,
        data: '0x095ea7b3',
      },
    },
    settings: { primaryCurrency: 'Fiat', showCustomNonce: false },
    engine: {
      backgroundState: {
        AccountTrackerController: {
          accountsByChainId: {
            [CHAIN_ID_MOCK]: {
              [FROM_CHECKSUM_MOCK]: { balance: BALANCE_MOCK },
            },
          },
        },
        GasFeeController: { gasEstimateType, gasFeeEstimates: {} },
        TransactionController: {
          transactions: [
            {
              id: TRANSACTION_ID_MOCK,
              chainId: CHAIN_ID_MOCK,
              status: 'unapproved',
              txParams: { from: FROM_MOCK, to: TO_MOCK, data: '0x095ea7b3' },
            },
          ],
        },
      },
    },
  });

const renderApprove = (store: Store = mockStore(buildState())) =>
  render(
    <Provider store={store}>
      <ThemeContext.Provider value={mockTheme}>
        <Approve
          modalVisible
          navigation={navigationMock}
          route={{ params: {} }}
          hideModal={hideModalMock}
        />
      </ThemeContext.Provider>
    </Provider>,
  );

const setGas = async (gas: Record<string, string>) => {
  await act(async () => {
    mockReviewProps.updateTransactionState(gas);
  });
};

const confirm = async () => {
  await act(async () => {
    await mockReviewProps.onConfirm();
  });
};

const getTransactionFinishedHandler = () => {
  const [eventName, handler, criteria] =
    mockEngine.controllerMessenger.subscribeOnceIf.mock.calls[0];
  expect(eventName).toBe('TransactionController:transactionFinished');
  return { handler, criteria };
};

const trackedEvents = () =>
  mockTrackEvent.mock.calls.map(([{ event }]) => event);

describe('Approve onConfirm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShouldUseSmartTransaction = false;
    mockReviewProps = {} as ReviewPropsMock;
    isHardwareAccountMock.mockReturnValue(false);
    updateTransactionMock.mockReturnValue(undefined);
    getDeviceIdMock.mockResolvedValue('ledger-device-id');
    mockEngine.controllerMessenger.subscribeOnceIf.mockReturnValue(
      SUBSCRIPTION_MOCK,
    );
    mockEngine.context.ApprovalController.accept.mockResolvedValue({});
    mockEngine.context.KeyringController.resetQRKeyringState.mockResolvedValue(
      undefined,
    );
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  describe('gas validation gate', () => {
    it('does not submit a legacy approval when the balance cannot cover totalHex', async () => {
      renderApprove();
      await setGas({ ...LEGACY_GAS_MOCK, totalHex: UNAFFORDABLE_TOTAL_MOCK });

      await confirm();

      expect(mockReviewProps.gasError).toMatch(
        /more ETH to complete this transaction/,
      );
      expect(
        mockEngine.controllerMessenger.subscribeOnceIf,
      ).not.toHaveBeenCalled();
      expect(updateTransactionMock).not.toHaveBeenCalled();
      expect(
        mockEngine.context.ApprovalController.accept,
      ).not.toHaveBeenCalled();
      expect(mockReviewProps.transactionConfirmed).toBe(false);
    });

    it('does not submit a fee-market approval when the balance cannot cover totalMaxHex', async () => {
      renderApprove(
        mockStore(
          buildState({ gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET }),
        ),
      );
      await setGas({
        ...EIP1559_GAS_MOCK,
        totalMaxHex: UNAFFORDABLE_TOTAL_MOCK,
        totalHex: AFFORDABLE_TOTAL_MOCK,
      });

      await confirm();

      expect(updateTransactionMock).not.toHaveBeenCalled();
      expect(
        mockEngine.context.ApprovalController.accept,
      ).not.toHaveBeenCalled();
    });

    it('submits a fee-market approval when the balance covers totalMaxHex', async () => {
      renderApprove(
        mockStore(
          buildState({ gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET }),
        ),
      );
      await setGas(EIP1559_GAS_MOCK);

      await confirm();

      expect(updateTransactionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: TRANSACTION_ID_MOCK,
          txParams: expect.objectContaining({
            chainId: CHAIN_ID_MOCK,
            gas: '0x5208',
            maxFeePerGas: '0x2',
            maxPriorityFeePerGas: '0x1',
          }),
        }),
      );
      expect(mockEngine.context.ApprovalController.accept).toHaveBeenCalledWith(
        TRANSACTION_ID_MOCK,
        undefined,
        { waitForResult: true },
      );
    });
  });

  describe('accept', () => {
    it('updates the transaction and accepts with waitForResult when smart transactions are off', async () => {
      renderApprove();
      await setGas(LEGACY_GAS_MOCK);

      await confirm();

      expect(updateTransactionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: TRANSACTION_ID_MOCK,
          txParams: expect.objectContaining({
            from: FROM_CHECKSUM_MOCK,
            chainId: CHAIN_ID_MOCK,
            gas: '0x5208',
            gasPrice: '0x1',
          }),
        }),
      );
      expect(
        mockEngine.context.KeyringController.resetQRKeyringState,
      ).toHaveBeenCalled();
      expect(mockEngine.context.ApprovalController.accept).toHaveBeenCalledWith(
        TRANSACTION_ID_MOCK,
        undefined,
        { waitForResult: true },
      );
      expect(hideModalMock).not.toHaveBeenCalled();
      expect(trackedEvents()).toContain(MetaMetricsEvents.APPROVAL_COMPLETED);
    });

    it('accepts without waitForResult and hides the modal when smart transactions are on', async () => {
      mockShouldUseSmartTransaction = true;
      renderApprove();
      await setGas(LEGACY_GAS_MOCK);

      await confirm();

      expect(mockEngine.context.ApprovalController.accept).toHaveBeenCalledWith(
        TRANSACTION_ID_MOCK,
        undefined,
        { waitForResult: false },
      );
      expect(hideModalMock).toHaveBeenCalledTimes(1);
      expect(trackedEvents()).toContain(MetaMetricsEvents.APPROVAL_COMPLETED);
    });

    it('ignores a second confirm while the first is being handled', async () => {
      let resolveAccept: (value: unknown) => void = () => undefined;
      mockEngine.context.ApprovalController.accept.mockReturnValue(
        new Promise((resolve) => {
          resolveAccept = resolve;
        }),
      );
      renderApprove();
      await setGas(LEGACY_GAS_MOCK);

      let firstConfirm: Promise<void> = Promise.resolve();
      await act(async () => {
        firstConfirm = mockReviewProps.onConfirm();
      });
      expect(
        mockEngine.context.ApprovalController.accept,
      ).toHaveBeenCalledTimes(1);

      await confirm();

      expect(updateTransactionMock).toHaveBeenCalledTimes(1);
      expect(
        mockEngine.context.ApprovalController.accept,
      ).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveAccept({});
        await firstConfirm;
      });
      expect(trackedEvents()).toContain(MetaMetricsEvents.APPROVAL_COMPLETED);
    });
  });

  describe('transactionFinished subscription', () => {
    it('only matches the approval transaction', async () => {
      renderApprove();
      await setGas(LEGACY_GAS_MOCK);
      await confirm();

      const { criteria } = getTransactionFinishedHandler();

      expect(criteria({ id: TRANSACTION_ID_MOCK })).toBe(true);
      expect(criteria({ id: 'other-tx' })).toBe(false);
    });

    it('marks the approval approved, hides the modal and watches the transaction when submitted', async () => {
      const { unmount } = renderApprove();
      await setGas(LEGACY_GAS_MOCK);
      await confirm();
      const { handler } = getTransactionFinishedHandler();
      const transactionMeta = { id: TRANSACTION_ID_MOCK, status: 'submitted' };

      await act(async () => {
        handler(transactionMeta);
      });

      expect(hideModalMock).toHaveBeenCalledTimes(1);
      expect(watchSubmittedTransactionMock).toHaveBeenCalledWith({
        ...transactionMeta,
        assetType: 'ETH',
      });
      expect(loggerErrorMock).not.toHaveBeenCalled();

      unmount();

      await waitFor(() =>
        expect(
          mockEngine.controllerMessenger.tryUnsubscribe,
        ).toHaveBeenCalledWith(
          'TransactionController:transactionFinished',
          SUBSCRIPTION_MOCK,
        ),
      );
      expect(mockEngine.rejectPendingApproval).not.toHaveBeenCalled();
    });

    it('logs the error and keeps the modal open when the transaction did not submit', async () => {
      const { unmount } = renderApprove();
      await setGas(LEGACY_GAS_MOCK);
      await confirm();
      const { handler } = getTransactionFinishedHandler();
      const error = new Error('transaction failed');

      await act(async () => {
        handler({ id: TRANSACTION_ID_MOCK, status: 'failed', error });
      });

      expect(loggerErrorMock).toHaveBeenCalledWith(
        error,
        'error while trying to finish a transaction (Approve)',
      );
      expect(hideModalMock).not.toHaveBeenCalled();
      expect(watchSubmittedTransactionMock).not.toHaveBeenCalled();

      unmount();

      await waitFor(() =>
        expect(mockEngine.rejectPendingApproval).toHaveBeenCalledWith(
          TRANSACTION_ID_MOCK,
          providerErrors.userRejectedRequest(),
          { ignoreMissing: true, logErrors: false },
        ),
      );
    });
  });

  describe('ledger accounts', () => {
    beforeEach(() => {
      isHardwareAccountMock.mockReturnValue(true);
    });

    it('hands signing over to the ledger modal instead of accepting', async () => {
      renderApprove();
      await setGas(LEGACY_GAS_MOCK);

      await confirm();

      expect(updateTransactionMock).toHaveBeenCalled();
      expect(getDeviceIdMock).toHaveBeenCalled();
      expect(navigationMock.navigate).toHaveBeenCalledWith(
        Routes.LEDGER_TRANSACTION_MODAL,
        expect.objectContaining({
          transactionId: TRANSACTION_ID_MOCK,
          deviceId: 'ledger-device-id',
          type: 'signTransaction',
          onConfirmationComplete: expect.any(Function),
        }),
      );
      expect(hideModalMock).toHaveBeenCalledTimes(1);
      expect(
        mockEngine.context.ApprovalController.accept,
      ).not.toHaveBeenCalled();
      expect(mockReviewProps.transactionConfirmed).toBe(false);
    });

    it('watches the submitted transaction without hiding the modal again', async () => {
      renderApprove();
      await setGas(LEGACY_GAS_MOCK);
      await confirm();
      const { handler } = getTransactionFinishedHandler();

      await act(async () => {
        handler({ id: TRANSACTION_ID_MOCK, status: 'submitted' });
      });

      expect(hideModalMock).toHaveBeenCalledTimes(1);
      expect(watchSubmittedTransactionMock).toHaveBeenCalledWith(
        expect.objectContaining({ id: TRANSACTION_ID_MOCK, assetType: 'ETH' }),
      );
    });

    it('does not reject the approval on unmount', async () => {
      const { unmount } = renderApprove();
      await setGas(LEGACY_GAS_MOCK);
      await confirm();

      unmount();

      await act(async () => {
        await Promise.resolve();
      });
      expect(mockEngine.rejectPendingApproval).not.toHaveBeenCalled();
      expect(
        mockEngine.controllerMessenger.tryUnsubscribe,
      ).not.toHaveBeenCalled();
    });
  });

  describe('errors', () => {
    it('alerts, logs and hides the modal when accept fails', async () => {
      const error = new Error('accept failed');
      mockEngine.context.ApprovalController.accept.mockRejectedValue(error);
      renderApprove();
      await setGas(LEGACY_GAS_MOCK);

      await confirm();

      expect(Alert.alert).toHaveBeenCalledWith(
        expect.any(String),
        'accept failed',
        [{ text: 'OK' }],
      );
      expect(loggerErrorMock).toHaveBeenCalledWith(
        error,
        'error while trying to send transaction (Approve)',
      );
      expect(hideModalMock).toHaveBeenCalledTimes(1);
      expect(trackedEvents()).not.toContain(
        MetaMetricsEvents.APPROVAL_COMPLETED,
      );
    });

    it('tracks a cancellation without alerting for smart transaction no-hash errors', async () => {
      mockEngine.context.ApprovalController.accept.mockRejectedValue(
        new Error(STX_NO_HASH_ERROR),
      );
      renderApprove();
      await setGas(LEGACY_GAS_MOCK);

      await confirm();

      expect(Alert.alert).not.toHaveBeenCalled();
      expect(hideModalMock).not.toHaveBeenCalled();
      expect(trackedEvents()).toContain(
        MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED,
      );
    });
  });

  describe('unmount', () => {
    it('unsubscribes and rejects the pending approval when not approved', async () => {
      const { unmount } = renderApprove();

      unmount();

      await waitFor(() =>
        expect(mockEngine.rejectPendingApproval).toHaveBeenCalledWith(
          TRANSACTION_ID_MOCK,
          providerErrors.userRejectedRequest(),
          { ignoreMissing: true, logErrors: false },
        ),
      );
      expect(
        mockEngine.controllerMessenger.tryUnsubscribe,
      ).toHaveBeenCalledWith(
        'TransactionController:transactionFinished',
        undefined,
      );
    });
  });
});
