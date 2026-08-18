import React from 'react';
import { act, fireEvent, render, within } from '@testing-library/react-native';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { EthMethod, EthScope } from '@metamask/keyring-api';
import { Store } from 'redux';

import initialRootState from '../../../util/test/initial-root-state';
import { ActivitiesViewSelectorsIDs } from '../../../../e2e/selectors/Transactions/ActivitiesView.selectors';
import { strings } from '../../../../locales/i18n';
import TransactionsView from './index';
import { selectSortedTransactions } from '../../../selectors/transactionController';

const ACCOUNT_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const COUNTERPARTY_ADDRESS = '0xaaaa567890abcdef1234567890abcdef1234aaaa';
const SENDER_ADDRESS = '0xbbbb567890abcdef1234567890abcdef1234bbbb';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();
const IMPORT_TIME = NOW - 30 * DAY;

let mockActivitySearchEnabled = true;

jest.mock('../../../selectors/featureFlagController/activitySearch', () => ({
  selectActivitySearchEnabled: jest.fn(() => mockActivitySearchEnabled),
}));

jest.mock('../../../util/activity', () => ({
  sortTransactions: jest.fn((txs) => txs),
  filterByAddressAndNetwork: jest.fn(() => true),
}));

jest.mock('../../../core/Engine', () => ({
  context: {
    KeyringController: {
      getOrAddQRKeyring: jest.fn(),
      cancelQRSignRequest: jest.fn().mockResolvedValue(undefined),
      state: { keyrings: [] },
    },
  },
  controllerMessenger: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
  rejectPendingApproval: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  const reactNavigationModule = jest.requireActual('@react-navigation/native');
  return {
    ...reactNavigationModule,
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 1, right: 2, bottom: 3, left: 4 };
  const frame = { width: 5, height: 6, x: 7, y: 8 };
  return {
    SafeAreaProvider: jest.fn().mockImplementation(({ children }) => children),
    SafeAreaConsumer: jest
      .fn()
      .mockImplementation(({ children }) => children(inset)),
    useSafeAreaInsets: jest.fn().mockImplementation(() => inset),
    useSafeAreaFrame: jest.fn().mockImplementation(() => frame),
  };
});

interface StubTransaction {
  id: string;
  insertImportTime?: boolean;
}

interface StubTransactionsProps {
  header?: React.ReactNode;
  transactions: StubTransaction[];
  submittedTransactions: StubTransaction[];
  confirmedTransactions: StubTransaction[];
  filtersActive?: boolean;
  onClearFilters?: () => void;
}

// The activity list itself is covered by its own tests; this suite is about
// what TransactionsView hands to it.
jest.mock('../../UI/Transactions', () => {
  const ReactActual = jest.requireActual('react');
  const { Text, View } = jest.requireActual('react-native');
  const ids = (txs: StubTransaction[]) => txs.map((tx) => tx.id).join(',');

  const StubTransactions = (props: StubTransactionsProps) =>
    ReactActual.createElement(
      View,
      null,
      props.header ?? null,
      ReactActual.createElement(
        Text,
        { testID: 'stub-transactions' },
        ids(props.transactions),
      ),
      ReactActual.createElement(
        Text,
        { testID: 'stub-submitted' },
        ids(props.submittedTransactions),
      ),
      ReactActual.createElement(
        Text,
        { testID: 'stub-confirmed' },
        ids(props.confirmedTransactions),
      ),
      ReactActual.createElement(
        Text,
        { testID: 'stub-markers' },
        ids(props.transactions.filter((tx) => tx.insertImportTime)),
      ),
      ReactActual.createElement(
        Text,
        { testID: 'stub-filters-active' },
        String(Boolean(props.filtersActive)),
      ),
    );

  return { __esModule: true, default: StubTransactions };
});

const buildTx = ({
  id,
  time,
  status,
  from,
  to,
}: {
  id: string;
  time: number;
  status: string;
  from: string;
  to: string;
}) => ({
  id,
  time,
  status,
  chainId: '0x1',
  isTransfer: true,
  txParams: { from, to, nonce: id, value: '0x0' },
});

// Newest first, matching the order the activity list receives.
const TRANSACTIONS = [
  buildTx({
    id: 'sent-recent',
    time: NOW - DAY,
    status: 'confirmed',
    from: ACCOUNT_ADDRESS,
    to: COUNTERPARTY_ADDRESS,
  }),
  buildTx({
    id: 'pending-send',
    time: NOW - 2 * DAY,
    status: 'submitted',
    from: ACCOUNT_ADDRESS,
    to: COUNTERPARTY_ADDRESS,
  }),
  buildTx({
    id: 'received',
    time: NOW - 3 * DAY,
    status: 'confirmed',
    from: SENDER_ADDRESS,
    to: ACCOUNT_ADDRESS,
  }),
  buildTx({
    id: 'sent-old',
    time: NOW - 60 * DAY,
    status: 'confirmed',
    from: ACCOUNT_ADDRESS,
    to: SENDER_ADDRESS,
  }),
];

jest.mock('../../../selectors/transactionController', () => ({
  selectSortedTransactions: jest.fn(() => []),
  selectTransactions: jest.fn(() => []),
  selectCurrentTransactionId: jest.fn(() => undefined),
}));

const Stack = createStackNavigator();
const mockStore = configureMockStore();

const buildStore = (): Store =>
  mockStore({
    ...initialRootState,
    settings: { primaryCurrency: 'Fiat' },
    alert: { isVisible: false },
    transaction: {},
    engine: {
      backgroundState: {
        ...initialRootState.engine.backgroundState,
        AccountsController: {
          internalAccounts: {
            selectedAccount: 'account-1',
            accounts: {
              'account-1': {
                id: 'account-1',
                type: 'eip155:eoa',
                address: ACCOUNT_ADDRESS,
                options: {},
                metadata: {
                  name: 'Account 1',
                  keyring: { type: 'HD Key Tree' },
                  importTime: IMPORT_TIME,
                },
                methods: [
                  EthMethod.PersonalSign,
                  EthMethod.SignTransaction,
                  EthMethod.SignTypedDataV4,
                ],
                scopes: [EthScope.Eoa],
              },
            },
          },
        },
      },
    },
  });

const renderActivity = () => {
  const utils = render(
    <Provider store={buildStore()}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="TransactionsView"
            component={TransactionsView as React.ComponentType}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>,
  );

  act(() => {
    jest.runAllTimers();
  });

  return utils;
};

const search = (utils: ReturnType<typeof renderActivity>, query: string) => {
  fireEvent.changeText(
    utils.getByTestId(ActivitiesViewSelectorsIDs.SEARCH_INPUT),
    query,
  );
  act(() => {
    jest.advanceTimersByTime(500);
  });
};

const renderedIds = (
  utils: ReturnType<typeof renderActivity>,
  testID: string,
) => utils.getByTestId(testID).props.children;

// Chip labels mirror the selected option labels, so option presses are scoped
// to the open sheet.
const pressSheetOption = (
  utils: ReturnType<typeof renderActivity>,
  label: string,
) => {
  fireEvent.press(
    within(
      utils.getByTestId(ActivitiesViewSelectorsIDs.FILTERS_BOTTOM_SHEET),
    ).getByText(label),
  );
  act(() => {
    jest.advanceTimersByTime(500);
  });
};

describe('TransactionsView activity filters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockActivitySearchEnabled = true;
    jest.mocked(selectSortedTransactions).mockReturnValue(
      TRANSACTIONS.map((tx) => ({
        ...tx,
        txParams: { ...tx.txParams },
      })) as unknown as ReturnType<typeof selectSortedTransactions>,
    );
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useFakeTimers({ legacyFakeTimers: true });
  });

  describe('with the feature flag off', () => {
    beforeEach(() => {
      mockActivitySearchEnabled = false;
    });

    it('renders no control bar and leaves the lists untouched', () => {
      const utils = renderActivity();

      expect(
        utils.queryByTestId(ActivitiesViewSelectorsIDs.CONTROL_BAR),
      ).toBeNull();
      expect(renderedIds(utils, 'stub-confirmed')).toBe(
        'sent-recent,received,sent-old',
      );
      expect(renderedIds(utils, 'stub-submitted')).toBe('pending-send');
      expect(renderedIds(utils, 'stub-filters-active')).toBe('false');
    });
  });

  it('renders the control bar when the feature flag is on', () => {
    const utils = renderActivity();

    expect(
      utils.getByTestId(ActivitiesViewSelectorsIDs.CONTROL_BAR),
    ).toBeTruthy();
    expect(renderedIds(utils, 'stub-filters-active')).toBe('false');
  });

  it('keeps pending transactions separate and in order while filtering', () => {
    const utils = renderActivity();

    search(utils, 'abcdef');

    expect(renderedIds(utils, 'stub-submitted')).toBe('pending-send');
    expect(renderedIds(utils, 'stub-confirmed')).toBe(
      'sent-recent,received,sent-old',
    );
  });

  it('narrows every list as the query is typed', () => {
    const utils = renderActivity();

    search(utils, 'bbbb');

    expect(renderedIds(utils, 'stub-confirmed')).toBe('received,sent-old');
    expect(renderedIds(utils, 'stub-submitted')).toBe('');
    expect(renderedIds(utils, 'stub-filters-active')).toBe('true');
  });

  it('restores the full list when the filters are cleared', () => {
    const utils = renderActivity();

    search(utils, 'bbbb');
    expect(renderedIds(utils, 'stub-confirmed')).toBe('received,sent-old');

    fireEvent.press(
      utils.getByTestId(ActivitiesViewSelectorsIDs.CLEAR_ALL_FILTERS),
    );
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(renderedIds(utils, 'stub-confirmed')).toBe(
      'sent-recent,received,sent-old',
    );
    expect(renderedIds(utils, 'stub-filters-active')).toBe('false');
  });

  it('combines selections with OR inside a category', () => {
    const utils = renderActivity();

    fireEvent.press(
      utils.getByTestId(ActivitiesViewSelectorsIDs.TYPE_FILTER_CHIP),
    );
    pressSheetOption(utils, strings('activity_view.filter_type_receive'));

    expect(renderedIds(utils, 'stub-confirmed')).toBe('received');

    pressSheetOption(utils, strings('activity_view.filter_type_send'));

    expect(renderedIds(utils, 'stub-confirmed')).toBe(
      'sent-recent,received,sent-old',
    );
  });

  it('combines categories with AND', () => {
    const utils = renderActivity();

    fireEvent.press(
      utils.getByTestId(ActivitiesViewSelectorsIDs.TYPE_FILTER_CHIP),
    );
    pressSheetOption(utils, strings('activity_view.filter_type_send'));

    fireEvent.press(
      utils.getByTestId(ActivitiesViewSelectorsIDs.DATE_FILTER_CHIP),
    );
    pressSheetOption(utils, strings('activity_view.filter_date_last_7_days'));

    // sent-old predates the range, received is not a send.
    expect(renderedIds(utils, 'stub-confirmed')).toBe('sent-recent');
    expect(renderedIds(utils, 'stub-submitted')).toBe('pending-send');
  });

  it('shows one active filter token per selection and clears them all at once', () => {
    const utils = renderActivity();

    fireEvent.press(
      utils.getByTestId(ActivitiesViewSelectorsIDs.TYPE_FILTER_CHIP),
    );
    pressSheetOption(utils, strings('activity_view.filter_type_send'));

    expect(
      utils.getAllByTestId(ActivitiesViewSelectorsIDs.ACTIVE_FILTER_TOKEN),
    ).toHaveLength(1);

    fireEvent.press(
      utils.getByTestId(ActivitiesViewSelectorsIDs.CLEAR_ALL_FILTERS),
    );
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(
      utils.queryAllByTestId(ActivitiesViewSelectorsIDs.ACTIVE_FILTER_TOKEN),
    ).toHaveLength(0);
  });

  it('recomputes the account added marker against the filtered list', () => {
    const utils = renderActivity();

    // Unfiltered, the marker sits on the first transaction older than the
    // account import time.
    expect(renderedIds(utils, 'stub-markers')).toBe('sent-old');

    fireEvent.press(
      utils.getByTestId(ActivitiesViewSelectorsIDs.TYPE_FILTER_CHIP),
    );
    pressSheetOption(utils, strings('activity_view.filter_type_receive'));

    // sent-old is filtered out, so the marker falls back to the last row that
    // is actually rendered instead of disappearing.
    expect(renderedIds(utils, 'stub-transactions')).toBe('received');
    expect(renderedIds(utils, 'stub-markers')).toBe('received');
  });

  it('tells the list when filters are active so it can show the filtered empty state', () => {
    const utils = renderActivity();

    search(utils, 'zzzznomatch');

    expect(renderedIds(utils, 'stub-transactions')).toBe('');
    expect(renderedIds(utils, 'stub-filters-active')).toBe('true');
  });
});
