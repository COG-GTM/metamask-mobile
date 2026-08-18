import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { ActivitiesViewSelectorsIDs } from '../../../../../e2e/selectors/Transactions/ActivitiesView.selectors';
import { strings } from '../../../../../locales/i18n';
import {
  ActivityStatusCategory,
  ActivityTypeCategory,
  DateRangePreset,
  EMPTY_ACTIVITY_FILTER_STATE,
} from '../../../hooks/useActivityFilters';
import { ActivityFilterSheet } from '../ActivityFilters.constants';
import ActivityFilterSheets from './ActivityFilterSheets';

jest.mock('@react-navigation/native', () => {
  const reactNavigationModule = jest.requireActual('@react-navigation/native');
  return {
    ...reactNavigationModule,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
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

const onTypesChange = jest.fn();
const onStatusesChange = jest.fn();
const onDateRangeChange = jest.fn();
const onClose = jest.fn();

const renderSheets = (
  openSheet: ActivityFilterSheet | null,
  filters = EMPTY_ACTIVITY_FILTER_STATE,
) =>
  render(
    <ActivityFilterSheets
      openSheet={openSheet}
      filters={filters}
      onTypesChange={onTypesChange}
      onStatusesChange={onStatusesChange}
      onDateRangeChange={onDateRangeChange}
      onClose={onClose}
    />,
  );

describe('ActivityFilterSheets', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders nothing when no sheet is open', () => {
    const { queryByTestId } = renderSheets(null);

    expect(
      queryByTestId(ActivitiesViewSelectorsIDs.FILTERS_BOTTOM_SHEET),
    ).toBeNull();
  });

  it('renders every type option in the type sheet', () => {
    const { getByTestId, getByText } = renderSheets(ActivityFilterSheet.Type);

    expect(
      getByTestId(ActivitiesViewSelectorsIDs.FILTERS_BOTTOM_SHEET),
    ).toBeTruthy();
    expect(getByText(strings('activity_view.filter_type_send'))).toBeTruthy();
    expect(
      getByText(strings('activity_view.filter_type_contract_interaction')),
    ).toBeTruthy();
  });

  it('adds a type to the selection without dropping the existing ones', () => {
    const { getByText } = renderSheets(ActivityFilterSheet.Type, {
      ...EMPTY_ACTIVITY_FILTER_STATE,
      types: [ActivityTypeCategory.Send],
    });

    fireEvent.press(getByText(strings('activity_view.filter_type_swap')));

    expect(onTypesChange).toHaveBeenCalledWith([
      ActivityTypeCategory.Send,
      ActivityTypeCategory.Swap,
    ]);
  });

  it('removes an already selected type when it is pressed again', () => {
    const { getByText } = renderSheets(ActivityFilterSheet.Type, {
      ...EMPTY_ACTIVITY_FILTER_STATE,
      types: [ActivityTypeCategory.Send, ActivityTypeCategory.Swap],
    });

    fireEvent.press(getByText(strings('activity_view.filter_type_send')));

    expect(onTypesChange).toHaveBeenCalledWith([ActivityTypeCategory.Swap]);
  });

  it('multi-selects statuses in the status sheet', () => {
    const { getByText } = renderSheets(ActivityFilterSheet.Status, {
      ...EMPTY_ACTIVITY_FILTER_STATE,
      statuses: [ActivityStatusCategory.Pending],
    });

    fireEvent.press(getByText(strings('activity_view.filter_status_failed')));

    expect(onStatusesChange).toHaveBeenCalledWith([
      ActivityStatusCategory.Pending,
      ActivityStatusCategory.Failed,
    ]);
  });

  it('exposes the selected state of each option to accessibility services', () => {
    const { getByLabelText } = renderSheets(ActivityFilterSheet.Status, {
      ...EMPTY_ACTIVITY_FILTER_STATE,
      statuses: [ActivityStatusCategory.Pending],
    });

    expect(
      getByLabelText(strings('activity_view.filter_status_pending')).props
        .accessibilityState.checked,
    ).toBe(true);
    expect(
      getByLabelText(strings('activity_view.filter_status_confirmed')).props
        .accessibilityState.checked,
    ).toBe(false);
  });

  it('applies a date preset and clears it when it is picked again', () => {
    const { getByText, rerender } = renderSheets(ActivityFilterSheet.Date);

    fireEvent.press(
      getByText(strings('activity_view.filter_date_last_7_days')),
    );
    expect(onDateRangeChange).toHaveBeenCalledWith({
      preset: DateRangePreset.Last7Days,
    });

    rerender(
      <ActivityFilterSheets
        openSheet={ActivityFilterSheet.Date}
        filters={{
          ...EMPTY_ACTIVITY_FILTER_STATE,
          dateRange: { preset: DateRangePreset.Last7Days },
        }}
        onTypesChange={onTypesChange}
        onStatusesChange={onStatusesChange}
        onDateRangeChange={onDateRangeChange}
        onClose={onClose}
      />,
    );

    fireEvent.press(
      getByText(strings('activity_view.filter_date_last_7_days')),
    );
    expect(onDateRangeChange).toHaveBeenLastCalledWith(undefined);
  });

  it('collects both bounds before applying a custom range', () => {
    const { getByText, queryByText } = renderSheets(ActivityFilterSheet.Date);

    expect(queryByText(strings('activity_view.filter_date_apply'))).toBeNull();

    fireEvent.press(getByText(strings('activity_view.filter_date_custom')));
    expect(onDateRangeChange).not.toHaveBeenCalled();

    fireEvent.press(getByText(strings('activity_view.filter_date_apply')));

    expect(onDateRangeChange).toHaveBeenCalledTimes(1);
    const range = onDateRangeChange.mock.calls[0][0];
    expect(range.preset).toBe(DateRangePreset.Custom);
    expect(range.startTime).toBeLessThanOrEqual(range.endTime);
  });
});
