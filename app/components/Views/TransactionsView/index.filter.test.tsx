import React from 'react';
import { act, render } from '@testing-library/react-native';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { EthMethod, EthScope } from '@metamask/keyring-api';
import TransactionsView from './index';
import Transactions from '../../UI/Transactions';
import initialRootState from '../../../util/test/initial-root-state';

const SELECTED_ADDRESS = '0xa9d8520b9f2da2a35df109daedf047cd7e10309a';
const SELECTED_ADDRESS_UPPER = `0x${SELECTED_ADDRESS.slice(2).toUpperCase()}`;
const OTHER_ADDRESS = '0x202637daaefbd7f131f90338a4a6c69f6cd5ce91';
const ACCOUNT_ID = '30786334-3935-4563-b064-363339643939';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSortedTransactions: any[] = [];

jest.mock('../../UI/Transactions', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('../../../util/activity', () => ({
  ...jest.requireActual('../../../util/activity'),
  filterByAddressAndNetwork: jest.fn(() => true),
}));

jest.mock('../../../util/transactions', () => ({
  addAccountTimeFlagFilter: jest.fn(() => false),
}));

jest.mock('../../../selectors/transactionController', () => ({
  ...jest.requireActual('../../../selectors/transactionController'),
  selectSortedTransactions: jest.fn(() => mockSortedTransactions),
}));

const Stack = createStackNavigator();
const mockStore = configureMockStore();

const tx = (
  id: string,
  time: number,
  status: string,
  from: string,
  nonce: string,
) => ({
  id,
  time,
  status,
  chainId: '0x1',
  txParams: { from, to: OTHER_ADDRESS, nonce, value: '0x0' },
});

const renderView = () => {
  const store = mockStore({
    ...initialRootState,
    settings: { primaryCurrency: 'Fiat' },
    engine: {
      backgroundState: {
        ...initialRootState.engine.backgroundState,
        AccountsController: {
          internalAccounts: {
            selectedAccount: ACCOUNT_ID,
            accounts: {
              [ACCOUNT_ID]: {
                id: ACCOUNT_ID,
                type: 'eip155:eoa',
                address: SELECTED_ADDRESS,
                options: {},
                metadata: {
                  name: 'Account 1',
                  keyring: { type: 'HD Key Tree' },
                  importTime: 0,
                },
                methods: [EthMethod.PersonalSign],
                scopes: [EthScope.Eoa],
              },
            },
          },
        },
      },
    },
  });

  render(
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="TransactionsView"
            // @ts-expect-error-next-line
            component={TransactionsView}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>,
  );
  act(() => {
    jest.runAllTimers();
  });

  const calls = (Transactions as unknown as jest.Mock).mock.calls;
  return calls[calls.length - 1][0];
};

describe('TransactionsView filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useFakeTimers({ legacyFakeTimers: true });
  });

  it('drops duplicate ids, keeping the selector order', () => {
    mockSortedTransactions = [
      tx('c', 30, 'confirmed', SELECTED_ADDRESS, '0x3'),
      tx('b', 20, 'confirmed', SELECTED_ADDRESS, '0x2'),
      tx('c', 15, 'confirmed', SELECTED_ADDRESS, '0x3'),
      tx('a', 10, 'confirmed', SELECTED_ADDRESS, '0x1'),
    ];

    const props = renderView();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(props.transactions.map((t: any) => t.id)).toEqual(['c', 'b', 'a']);
    expect(props.transactions[0]).toBe(mockSortedTransactions[0]);
  });

  it('hides submitted txs whose nonce is confirmed or already listed', () => {
    mockSortedTransactions = [
      tx('s1', 50, 'submitted', SELECTED_ADDRESS, '0x5'),
      tx('s2', 40, 'submitted', SELECTED_ADDRESS_UPPER, '0x5'),
      tx('s3', 35, 'submitted', SELECTED_ADDRESS, '0x4'),
      tx('s4', 33, 'submitted', OTHER_ADDRESS, '0x6'),
      tx('c1', 30, 'confirmed', SELECTED_ADDRESS_UPPER, '0x4'),
      tx('c2', 20, 'confirmed', OTHER_ADDRESS, '0x5'),
    ];

    const props = renderView();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(props.submittedTransactions.map((t: any) => t.id)).toEqual(['s1']);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(props.confirmedTransactions.map((t: any) => t.id)).toEqual([
      'c1',
      'c2',
    ]);
  });
});
