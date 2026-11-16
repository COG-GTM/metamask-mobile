import React from 'react';
import { Dimensions } from 'react-native';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { act, render } from '@testing-library/react-native';
import { CANCEL_RATE, SPEED_UP_RATE } from '@metamask/transaction-controller';
import TransactionNotification from './';
import decodeTransaction from '../../TransactionElement/utils';
import Engine from '../../../../core/Engine';
import { speedUpTransaction } from '../../../../util/transaction-controller';
import { validateTransactionActionBalance } from '../../../../util/transactions';
import { backgroundState } from '../../../../util/test/initial-root-state';

// Distinct rates so the test can tell which one the component picked.
jest.mock('@metamask/transaction-controller', () => ({
  ...jest.requireActual('@metamask/transaction-controller'),
  CANCEL_RATE: 1.5,
  SPEED_UP_RATE: 1.2,
}));

jest.mock('../../TransactionElement/utils', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../../../core/Engine', () => ({
  __esModule: true,
  default: {
    context: {
      TransactionController: { stopTransaction: jest.fn() },
    },
  },
}));

jest.mock('../../../../util/transaction-controller', () => ({
  ...jest.requireActual('../../../../util/transaction-controller'),
  speedUpTransaction: jest.fn(),
}));

jest.mock('../../../../util/transactions', () => {
  const actual = jest.requireActual('../../../../util/transactions');
  return {
    ...actual,
    validateTransactionActionBalance: jest.fn(
      actual.validateTransactionActionBalance,
    ),
  };
});

jest.mock('react-native-elevated-view', () => {
  const { View } = jest.requireActual('react-native');
  return View;
});

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockChildProps: Record<string, any> = {};
function mockCapture(name: string) {
  return (props: any) => {
    mockChildProps[name] = props;
    return props.children ?? null;
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

jest.mock('../BaseNotification', () => mockCapture('BaseNotification'));
jest.mock('../../TransactionElement/TransactionDetails', () =>
  mockCapture('TransactionDetails'),
);
jest.mock('../../ActionModal/ActionContent', () =>
  mockCapture('ActionContent'),
);
jest.mock('../../TransactionActionModal/TransactionActionContent', () =>
  mockCapture('TransactionActionContent'),
);

const mockDecodeTransaction = decodeTransaction as jest.Mock;
const mockSpeedUpTransaction = speedUpTransaction as jest.Mock;
const mockStopTransaction = Engine.context.TransactionController
  .stopTransaction as jest.Mock;
const mockValidateBalance = validateTransactionActionBalance as jest.Mock;

const WINDOW_WIDTH = Dimensions.get('window').width;
const FROM = '0x0000000000000000000000000000000000000001';
const TX_ID = 'notified-tx';
const TX_HASH = '0xabc';
// 0.001 ETH in wei, so the replacement fee renders as a readable ETH amount.
const GAS_PRICE = '0x38d7ea4c68000';

const buildTx = (overrides: Record<string, unknown> = {}) => ({
  id: TX_ID,
  status: 'submitted',
  chainId: '0x1',
  hash: TX_HASH,
  txParams: {
    from: FROM,
    to: '0x0000000000000000000000000000000000000002',
    value: '0x0',
    gas: '0x5208',
    gasPrice: GAS_PRICE,
  },
  ...overrides,
});

const buildState = ({
  transactions = [buildTx()],
  smartTransactions = [],
  balance = '0x56bc75e2d63100000', // 100 ETH
}: {
  transactions?: unknown[];
  smartTransactions?: unknown[];
  balance?: string;
} = {}) => ({
  settings: { primaryCurrency: 'ETH', showFiatOnTestnets: true },
  collectibles: {},
  engine: {
    backgroundState: {
      ...backgroundState,
      TransactionController: {
        ...backgroundState.TransactionController,
        transactions,
      },
      AccountTrackerController: {
        ...backgroundState.AccountTrackerController,
        accountsByChainId: { '0x1': { [FROM]: { balance } } },
      },
      SmartTransactionsController: {
        ...backgroundState.SmartTransactionsController,
        smartTransactionsState: {
          ...backgroundState.SmartTransactionsController
            ?.smartTransactionsState,
          smartTransactions: { '0x1': smartTransactions },
        },
      },
    },
  },
});

const renderNotification = async (
  state: unknown = buildState(),
  status = 'pending',
) => {
  const store = createStore((s: unknown) => s, state);
  const animatedTimingStart = jest.fn();
  const onClose = jest.fn();
  const utils = render(
    <Provider store={store}>
      <TransactionNotification
        {...({
          currentNotification: { status, transaction: { id: TX_ID } },
          notificationAnimated: { value: 0 },
          animatedTimingStart,
          onClose,
          isInBrowserView: false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)}
      />
    </Provider>,
  );
  await act(async () => undefined);
  return { ...utils, animatedTimingStart, onClose };
};

const openDetails = async () => {
  await act(async () => {
    mockChildProps.BaseNotification.onPress();
  });
};

const press = async (name: string, prop: string) => {
  await act(async () => {
    mockChildProps[name][prop]();
  });
};

describe('TransactionNotification', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    Object.keys(mockChildProps).forEach((k) => delete mockChildProps[k]);
    mockDecodeTransaction.mockResolvedValue([
      { notificationKey: 'Sent', actionKey: 'Sent ETH' },
      { summaryAmount: '0' },
    ]);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders the notification with the decoded title and tx params', async () => {
    await renderNotification();

    expect(mockDecodeTransaction).toHaveBeenCalled();
    expect(mockChildProps.BaseNotification.status).toBe('pending');
    expect(mockChildProps.BaseNotification.data).toMatchObject({
      id: TX_ID,
      from: FROM,
      gasPrice: GAS_PRICE,
      title: 'Sent',
    });
  });

  describe('speed up', () => {
    it('validates balance with SPEED_UP_RATE and shows gasPrice x SPEED_UP_RATE as the fee', async () => {
      const { animatedTimingStart } = await renderNotification();
      await openDetails();
      await press('TransactionDetails', 'showSpeedUpModal');

      expect(SPEED_UP_RATE).toBe(1.2);
      expect(mockValidateBalance).toHaveBeenCalledWith(
        expect.objectContaining({ id: TX_ID }),
        SPEED_UP_RATE,
        expect.any(Object),
      );
      expect(animatedTimingStart).toHaveBeenCalledWith(
        expect.anything(),
        -WINDOW_WIDTH,
      );
      // 0.001 ETH * 1.2
      expect(mockChildProps.TransactionActionContent.feeText).toBe(
        '0.0012 ETH',
      );
      expect(mockChildProps.TransactionActionContent.titleText).toBe(
        'Attempt to speed up?',
      );
      expect(mockChildProps.ActionContent.confirmDisabled).toBe(false);
    });

    it('calls speedUpTransaction with the tx id and slides the action back on confirm', async () => {
      const { animatedTimingStart } = await renderNotification();
      await openDetails();
      await press('TransactionDetails', 'showSpeedUpModal');
      animatedTimingStart.mockClear();

      await press('ActionContent', 'onConfirmPress');

      expect(mockSpeedUpTransaction).toHaveBeenCalledWith(TX_ID);
      expect(mockStopTransaction).not.toHaveBeenCalled();
      expect(animatedTimingStart).toHaveBeenCalledWith(expect.anything(), 0);
    });

    it('still finishes the action when speedUpTransaction throws', async () => {
      mockSpeedUpTransaction.mockImplementation(() => {
        throw new Error('already mined');
      });
      const { animatedTimingStart } = await renderNotification();
      await openDetails();
      await press('TransactionDetails', 'showSpeedUpModal');
      animatedTimingStart.mockClear();

      await expect(
        press('ActionContent', 'onConfirmPress'),
      ).resolves.toBeUndefined();

      expect(mockSpeedUpTransaction).toHaveBeenCalledWith(TX_ID);
      expect(animatedTimingStart).toHaveBeenCalledWith(expect.anything(), 0);
    });
  });

  describe('cancel', () => {
    it('validates balance with CANCEL_RATE and shows gasPrice x CANCEL_RATE as the fee', async () => {
      await renderNotification();
      await openDetails();
      await press('TransactionDetails', 'showCancelModal');

      expect(CANCEL_RATE).toBe(1.5);
      expect(mockValidateBalance).toHaveBeenCalledWith(
        expect.objectContaining({ id: TX_ID }),
        CANCEL_RATE,
        expect.any(Object),
        { isCancel: true },
      );
      // 0.001 ETH * 1.5
      expect(mockChildProps.TransactionActionContent.feeText).toBe(
        '0.0015 ETH',
      );
      expect(mockChildProps.TransactionActionContent.titleText).toBe(
        'Attempt to cancel?',
      );
    });

    it('calls TransactionController.stopTransaction with the tx id on confirm', async () => {
      const { animatedTimingStart } = await renderNotification();
      await openDetails();
      await press('TransactionDetails', 'showCancelModal');
      animatedTimingStart.mockClear();

      await press('ActionContent', 'onConfirmPress');

      expect(mockStopTransaction).toHaveBeenCalledWith(TX_ID);
      expect(mockSpeedUpTransaction).not.toHaveBeenCalled();
      expect(animatedTimingStart).toHaveBeenCalledWith(expect.anything(), 0);
    });

    it('slides the action back without stopping the tx on "nevermind"', async () => {
      const { animatedTimingStart } = await renderNotification();
      await openDetails();
      await press('TransactionDetails', 'showCancelModal');
      animatedTimingStart.mockClear();

      await press('ActionContent', 'onCancelPress');

      expect(mockStopTransaction).not.toHaveBeenCalled();
      expect(animatedTimingStart).toHaveBeenCalledWith(expect.anything(), 0);
    });
  });

  it.each([['showSpeedUpModal'], ['showCancelModal']])(
    'disables confirm when validateTransactionActionBalance returns true (%s)',
    async (action) => {
      mockValidateBalance.mockReturnValueOnce(true);
      await renderNotification();
      await openDetails();
      await press('TransactionDetails', action);

      expect(mockChildProps.ActionContent.confirmDisabled).toBe(true);
      expect(mockChildProps.TransactionActionContent.confirmDisabled).toBe(
        true,
      );
    },
  );

  describe('smart transactions', () => {
    it('renders nothing for a submitted tx with a matching smart transaction', async () => {
      const { toJSON } = await renderNotification(
        buildState({ smartTransactions: [{ txHash: TX_HASH }] }),
      );

      expect(toJSON()).toBeNull();
    });

    it('renders a submitted tx with no matching smart transaction', async () => {
      const { toJSON } = await renderNotification(
        buildState({ smartTransactions: [{ txHash: '0xother' }] }),
      );

      expect(toJSON()).not.toBeNull();
      expect(mockChildProps.BaseNotification).toBeDefined();
    });

    it('renders a confirmed tx even with a matching smart transaction', async () => {
      const { toJSON } = await renderNotification(
        buildState({
          transactions: [buildTx({ status: 'confirmed' })],
          smartTransactions: [{ txHash: TX_HASH }],
        }),
        'success',
      );

      expect(toJSON()).not.toBeNull();
    });
  });

  it('auto-closes the notification after mount', async () => {
    const { onClose } = await renderNotification();
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it.each([['showSpeedUpModal'], ['showCancelModal']])(
    'disables confirm when the sender balance cannot cover the replacement (%s, real balance check)',
    async (action) => {
      // 21000 gas * 0.001 ETH gasPrice * rate is far above 1 wei.
      await renderNotification(buildState({ balance: '0x1' }));
      await openDetails();
      await press('TransactionDetails', action);

      expect(mockChildProps.ActionContent.confirmDisabled).toBe(true);
    },
  );

  it('allows cancel but not speed up when the balance covers the replacement gas but not the original value (real balance check)', async () => {
    // Replacement gas: 21000 * 0.001 ETH * 1.2 = 25.2 ETH (speed up), * 1.5 = 31.5 ETH (cancel).
    const state = buildState({
      transactions: [
        buildTx({
          txParams: {
            ...buildTx().txParams,
            value: '0x2b5e3af16b1880000', // 50 ETH
          },
        }),
      ],
      balance: '0x22b1c8c1227a00000', // 40 ETH
    });

    await renderNotification(state);
    await openDetails();
    await press('TransactionDetails', 'showSpeedUpModal');
    expect(mockChildProps.ActionContent.confirmDisabled).toBe(true);

    await press('ActionContent', 'onCancelPress');
    await press('TransactionDetails', 'showCancelModal');
    expect(mockChildProps.ActionContent.confirmDisabled).toBe(false);
  });

  it('keeps confirm enabled when the sender balance covers the replacement (real balance check)', async () => {
    // 100 ETH
    await renderNotification(buildState({ balance: '0x56bc75e2d63100000' }));
    await openDetails();
    await press('TransactionDetails', 'showSpeedUpModal');

    expect(mockChildProps.ActionContent.confirmDisabled).toBe(false);
  });
});
