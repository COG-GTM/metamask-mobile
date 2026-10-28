import React from 'react';
import { act, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { AnyAction, createStore } from 'redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Approve from './index';
import { ThemeContext, mockTheme } from '../../../../../../util/theme';
import initialRootState from '../../../../../../util/test/initial-root-state';

const mockReviewRender = jest.fn();

jest.mock('../../components/ApproveTransactionReview', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockReviewRender(props);
    return null;
  },
}));

jest.mock('../../../../../../selectors/smartTransactionsController', () => ({
  selectSmartTransactionsEnabled: () => false,
  selectShouldUseSmartTransaction: () => false,
  selectPendingSmartTransactionsBySender: () => [],
}));

jest.mock('../../../../../../selectors/preferencesController', () => ({
  selectSmartTransactionsBannerDismissed: () => false,
  selectSmartTransactionsMigrationApplied: () => false,
  selectSmartTransactionsOptInStatus: () => false,
  selectIsTokenNetworkFilterEqualCurrentNetwork: () => true,
}));

jest.mock('../../../../../../core/GasPolling/GasPolling', () => ({
  startGasPolling: jest.fn().mockResolvedValue(null),
  stopGasPolling: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../../../../../core/Engine', () => ({
  controllerMessenger: {
    tryUnsubscribe: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
  rejectPendingApproval: jest.fn(),
  context: {
    AccountsController: {
      state: {
        internalAccounts: {
          accounts: {
            '30786334-3935-4563-b064-363339643939': {
              address: '0xc4955c0d639d99699bfd7ec54d9fafee40e4d272',
            },
          },
        },
      },
    },
    AssetsContractController: {
      getERC20BalanceOf: jest.fn().mockResolvedValue(null),
    },
    KeyringController: {
      getOrAddQRKeyring: jest.fn(),
      state: { keyrings: [] },
    },
    TransactionController: {
      getNonceLock: jest
        .fn()
        .mockResolvedValue({ nextNonce: 2, releaseLock: jest.fn() }),
    },
  },
}));

jest.mock('../../../../../../util/transactions', () => ({
  ...jest.requireActual('../../../../../../util/transactions'),
  getMethodData: jest.fn().mockResolvedValue({}),
  decodeApproveData: jest.fn().mockReturnValue({
    spenderAddress: '0x123',
    encodedAmount: '0x456',
  }),
}));

const SPENDER = '0x0000000000000000000000000000000000000007';
const UNRELATED_UPDATE = 'TEST_UNRELATED_UPDATE';
const TRANSACTION_UPDATE = 'TEST_TRANSACTION_UPDATE';

const contacts = Object.fromEntries(
  Array.from({ length: 20 }, (_, i) => {
    const address = `0x${(i + 1).toString(16).padStart(40, '0')}`;
    return [
      address,
      { address, name: `contact ${i}`, chainId: '0x1', memo: '', isEns: false },
    ];
  }),
);

const initialState = {
  ...initialRootState,
  transaction: {
    id: '123',
    chainId: '0x1',
    transaction: {
      to: SPENDER,
      from: '0xc4955c0d639d99699bfd7ec54d9fafee40e4d272',
    },
  },
  settings: { primaryCurrency: 'Fiat' },
  alert: { isVisible: false },
  engine: {
    backgroundState: {
      ...initialRootState.engine.backgroundState,
      AddressBookController: { addressBook: { '0x1': contacts } },
      AccountsController: {
        ...initialRootState.engine.backgroundState.AccountsController,
        internalAccounts: {
          ...initialRootState.engine.backgroundState.AccountsController
            .internalAccounts,
          selectedAccount: '30786334-3935-4563-b064-363339643939',
          accounts: {
            '30786334-3935-4563-b064-363339643939': {
              address: '0xc4955c0d639d99699bfd7ec54d9fafee40e4d272',
            },
          },
        },
      },
    },
  },
};

type TestState = typeof initialState & { unrelatedCounter?: number };

const reducer = (prevState: TestState | undefined, action: AnyAction) => {
  const state: TestState = prevState ?? initialState;
  switch (action.type) {
    case UNRELATED_UPDATE:
      return { ...state, unrelatedCounter: (state.unrelatedCounter ?? 0) + 1 };
    case TRANSACTION_UPDATE:
      return {
        ...state,
        transaction: { ...state.transaction, ...action.payload },
      };
    default:
      return state;
  }
};

const Stack = createStackNavigator();

const renderApprove = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const store = createStore(reducer as any);
  render(
    <Provider store={store}>
      <ThemeContext.Provider value={mockTheme}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Approve">
              {() => (
                <Approve
                  modalVisible
                  navigation={{
                    setOptions: jest.fn(),
                    setParams: jest.fn(),
                    navigate: jest.fn(),
                  }}
                  route={{ params: {} }}
                  hideModal={jest.fn()}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeContext.Provider>
    </Provider>,
  );
  return store;
};

const lastReviewProps = () =>
  mockReviewRender.mock.calls[mockReviewRender.mock.calls.length - 1][0];

describe('Approve re-renders', () => {
  beforeEach(() => mockReviewRender.mockClear());

  it('does not re-render on dispatches that leave the transaction unchanged', async () => {
    const store = renderApprove();
    await act(async () => undefined);
    const rendersBefore = mockReviewRender.mock.calls.length;
    expect(rendersBefore).toBeGreaterThan(0);

    await act(async () => {
      for (let i = 0; i < 5; i++) {
        store.dispatch({ type: UNRELATED_UPDATE });
      }
    });

    expect(mockReviewRender).toHaveBeenCalledTimes(rendersBefore);
  });

  it('keeps contact props stable across re-renders when the address book is unchanged', async () => {
    const store = renderApprove();
    await act(async () => undefined);
    const before = lastReviewProps();
    const rendersBefore = mockReviewRender.mock.calls.length;

    await act(async () => {
      store.dispatch({ type: TRANSACTION_UPDATE, payload: { origin: 'x' } });
    });

    expect(mockReviewRender.mock.calls.length).toBeGreaterThan(rendersBefore);
    const after = lastReviewProps();
    expect(after.savedContactListToArray).toBe(before.savedContactListToArray);
    expect(after.savedContactListToArray).toHaveLength(20);
    expect(after.nicknameExists).toBe(true);
    expect(after.nickname).toBe('contact 6');
  });
});
