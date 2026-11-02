import React from 'react';
import { Provider } from 'react-redux';
import { createStore, AnyAction } from 'redux';
import { act, render } from '@testing-library/react-native';
import TransactionNotification from './';
import decodeTransaction from '../../TransactionElement/utils';
import { backgroundState } from '../../../../util/test/initial-root-state';

jest.mock('../../TransactionElement/utils', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('../BaseNotification', () => () => null);
jest.mock('react-native-elevated-view', () => {
  const { View } = jest.requireActual('react-native');
  return View;
});
jest.mock('../../TransactionElement/TransactionDetails', () => () => null);
jest.mock(
  '../../TransactionActionModal/TransactionActionContent',
  () => () => null,
);
jest.mock('../../ActionModal/ActionContent', () => () => null);

const mockDecodeTransaction = decodeTransaction as jest.Mock;

const NOTIFIED_TX_ID = 'notified-tx';

const notifiedTx = {
  id: NOTIFIED_TX_ID,
  status: 'submitted',
  chainId: '0x1',
  hash: '0xabc',
  txParams: {
    from: '0x0000000000000000000000000000000000000001',
    to: '0x0000000000000000000000000000000000000002',
    value: '0x1',
    gasPrice: '0x3b9aca00',
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type State = any;

const buildState = (
  transactions: unknown[],
  overrides: Record<string, unknown> = {},
): State => ({
  settings: { primaryCurrency: 'ETH', showFiatOnTestnets: true },
  collectibles: {},
  engine: {
    backgroundState: {
      ...backgroundState,
      TransactionController: {
        ...backgroundState.TransactionController,
        transactions,
      },
      ...overrides,
    },
  },
});

const renderNotification = (initialState: State) => {
  const store = createStore(
    (state: State, action: AnyAction) =>
      action.type === 'REPLACE_STATE' ? action.state : state,
    initialState,
  );
  const props = {
    currentNotification: {
      status: 'pending',
      transaction: { id: NOTIFIED_TX_ID },
    },
    notificationAnimated: { value: 0 },
    animatedTimingStart: jest.fn(),
    onClose: jest.fn(),
    isInBrowserView: false,
  };
  const utils = render(
    <Provider store={store}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <TransactionNotification {...(props as any)} />
    </Provider>,
  );
  const replaceState = async (state: State) => {
    await act(async () => {
      store.dispatch({ type: 'REPLACE_STATE', state });
    });
  };
  return { ...utils, replaceState };
};

const flush = () => act(async () => undefined);

describe('TransactionNotification', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockDecodeTransaction.mockReset();
    mockDecodeTransaction.mockResolvedValue([
      { notificationKey: 'sent', actionKey: 'Sent' },
      {},
    ]);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('decodes the notified transaction once on mount', async () => {
    renderNotification(buildState([notifiedTx]));
    await flush();

    expect(mockDecodeTransaction).toHaveBeenCalledTimes(1);
    expect(mockDecodeTransaction.mock.calls[0][0].tx).toBe(notifiedTx);
  });

  it('does not re-decode on store updates that leave the notified transaction unchanged', async () => {
    const { replaceState } = renderNotification(buildState([notifiedTx]));
    await flush();
    expect(mockDecodeTransaction).toHaveBeenCalledTimes(1);

    // New transactions array (another tx was added) but the same notified tx object.
    const otherTx = { ...notifiedTx, id: 'other-tx', hash: '0xdef' };
    await replaceState(buildState([otherTx, notifiedTx]));

    // Balance polling update for an unrelated slice.
    await replaceState(
      buildState([otherTx, notifiedTx], {
        AccountTrackerController: {
          ...backgroundState.AccountTrackerController,
          accountsByChainId: {
            '0x1': {
              '0x0000000000000000000000000000000000000001': {
                balance: '0x123',
              },
            },
          },
        },
      }),
    );

    // swapsTransactions / smartTransactions fallbacks must stay referentially stable.
    await replaceState(buildState([otherTx, notifiedTx]));

    expect(mockDecodeTransaction).toHaveBeenCalledTimes(1);
  });

  it('re-decodes when the notified transaction object changes', async () => {
    const { replaceState } = renderNotification(buildState([notifiedTx]));
    await flush();

    const confirmedTx = { ...notifiedTx, status: 'confirmed' };
    await replaceState(buildState([confirmedTx]));

    expect(mockDecodeTransaction).toHaveBeenCalledTimes(2);
    expect(mockDecodeTransaction.mock.calls[1][0].tx).toBe(confirmedTx);
  });

  it('does not decode when the notified transaction is not in the store', async () => {
    renderNotification(buildState([]));
    await flush();

    expect(mockDecodeTransaction).not.toHaveBeenCalled();
  });
});
