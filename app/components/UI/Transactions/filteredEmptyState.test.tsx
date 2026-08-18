import React from 'react';
import { act, fireEvent } from '@testing-library/react-native';

import Transactions from '.';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../util/test/accountsControllerTestUtils';
import { ActivitiesViewSelectorsIDs } from '../../../../e2e/selectors/Transactions/ActivitiesView.selectors';
import { strings } from '../../../../locales/i18n';

jest.mock('../../../core/Engine', () => ({
  context: {
    KeyringController: {
      state: { keyrings: [] },
      getOrAddQRKeyring: jest.fn(),
      cancelQRSignRequest: jest.fn().mockResolvedValue(undefined),
    },
  },
  controllerMessenger: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
  rejectPendingApproval: jest.fn(),
}));

const initialState = {
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
    },
  },
  settings: { primaryCurrency: 'USD' },
};

const onClearFilters = jest.fn();

const renderTransactions = (props: Record<string, unknown>) => {
  const utils = renderWithProvider(
    <Transactions
      transactions={[]}
      submittedTransactions={[]}
      confirmedTransactions={[]}
      loading={false}
      onClearFilters={onClearFilters}
      {...props}
    />,
    { state: initialState },
  );

  // The list only renders once the component flips itself to ready.
  act(() => {
    jest.advanceTimersByTime(200);
  });

  return utils;
};

describe('Transactions empty states', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useFakeTimers({ legacyFakeTimers: true });
  });

  it('keeps the no-history empty state when no filter is active', () => {
    const { getByText, queryByTestId } = renderTransactions({
      filtersActive: false,
    });

    expect(getByText(strings('wallet.no_transactions'))).toBeTruthy();
    expect(
      queryByTestId(ActivitiesViewSelectorsIDs.FILTERED_EMPTY_STATE),
    ).toBeNull();
  });

  it('renders the filtered empty state when filters match nothing', () => {
    const { getByTestId, getByText, queryByText } = renderTransactions({
      filtersActive: true,
    });

    expect(
      getByTestId(ActivitiesViewSelectorsIDs.FILTERED_EMPTY_STATE),
    ).toBeTruthy();
    expect(getByText(strings('activity_view.no_results_title'))).toBeTruthy();
    expect(queryByText(strings('wallet.no_transactions'))).toBeNull();

    fireEvent.press(getByText(strings('activity_view.no_results_cta')));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});
