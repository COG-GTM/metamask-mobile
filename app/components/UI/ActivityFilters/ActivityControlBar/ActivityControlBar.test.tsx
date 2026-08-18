import React from 'react';
import { fireEvent } from '@testing-library/react-native';

import renderWithProvider from '../../../../util/test/renderWithProvider';
import { ActivitiesViewSelectorsIDs } from '../../../../../e2e/selectors/Transactions/ActivitiesView.selectors';
import { strings } from '../../../../../locales/i18n';
import {
  ActivityStatusCategory,
  ActivityTypeCategory,
  DateRangePreset,
  EMPTY_ACTIVITY_FILTER_STATE,
} from '../../../hooks/useActivityFilters';
import { ActivityFilterSheet } from '../ActivityFilters.constants';
import ActivityControlBar from './ActivityControlBar';

const defaultProps = {
  filters: EMPTY_ACTIVITY_FILTER_STATE,
  isFiltered: false,
  onQueryChange: jest.fn(),
  onTypesChange: jest.fn(),
  onStatusesChange: jest.fn(),
  onDateRangeChange: jest.fn(),
  onClearFilters: jest.fn(),
  onOpenSheet: jest.fn(),
};

const renderControlBar = (props: Partial<typeof defaultProps> = {}) =>
  renderWithProvider(<ActivityControlBar {...defaultProps} {...props} />);

describe('ActivityControlBar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the search field and the three filter chips', () => {
    const { getByTestId } = renderControlBar();

    expect(getByTestId(ActivitiesViewSelectorsIDs.CONTROL_BAR)).toBeTruthy();
    expect(getByTestId(ActivitiesViewSelectorsIDs.SEARCH_INPUT)).toBeTruthy();
    expect(
      getByTestId(ActivitiesViewSelectorsIDs.TYPE_FILTER_CHIP),
    ).toBeTruthy();
    expect(
      getByTestId(ActivitiesViewSelectorsIDs.STATUS_FILTER_CHIP),
    ).toBeTruthy();
    expect(
      getByTestId(ActivitiesViewSelectorsIDs.DATE_FILTER_CHIP),
    ).toBeTruthy();
  });

  it('reports every keystroke immediately, without local debouncing', () => {
    const { getByTestId } = renderControlBar();

    fireEvent.changeText(
      getByTestId(ActivitiesViewSelectorsIDs.SEARCH_INPUT),
      'alice',
    );

    expect(defaultProps.onQueryChange).toHaveBeenCalledTimes(1);
    expect(defaultProps.onQueryChange).toHaveBeenCalledWith('alice');
  });

  it('opens the matching bottom sheet when a chip is pressed', () => {
    const { getByTestId } = renderControlBar();

    fireEvent.press(getByTestId(ActivitiesViewSelectorsIDs.TYPE_FILTER_CHIP));
    fireEvent.press(getByTestId(ActivitiesViewSelectorsIDs.STATUS_FILTER_CHIP));
    fireEvent.press(getByTestId(ActivitiesViewSelectorsIDs.DATE_FILTER_CHIP));

    expect(defaultProps.onOpenSheet.mock.calls).toEqual([
      [ActivityFilterSheet.Type],
      [ActivityFilterSheet.Status],
      [ActivityFilterSheet.Date],
    ]);
  });

  it('labels chips with the current selection and marks them selected', () => {
    const { getByTestId } = renderControlBar({
      filters: {
        ...EMPTY_ACTIVITY_FILTER_STATE,
        types: [ActivityTypeCategory.Send, ActivityTypeCategory.Swap],
        statuses: [ActivityStatusCategory.Failed],
        dateRange: { preset: DateRangePreset.Last7Days },
      },
      isFiltered: true,
    });

    const typeChip = getByTestId(ActivitiesViewSelectorsIDs.TYPE_FILTER_CHIP);
    const statusChip = getByTestId(
      ActivitiesViewSelectorsIDs.STATUS_FILTER_CHIP,
    );
    const dateChip = getByTestId(ActivitiesViewSelectorsIDs.DATE_FILTER_CHIP);

    expect(typeChip.props.accessibilityLabel).toBe(
      `${strings('activity_view.filter_type_send')}, ${strings(
        'activity_view.filter_type_swap',
      )}`,
    );
    expect(typeChip.props.accessibilityState.selected).toBe(true);
    expect(statusChip.props.accessibilityLabel).toBe(
      strings('activity_view.filter_status_failed'),
    );
    expect(statusChip.props.accessibilityState.selected).toBe(true);
    expect(dateChip.props.accessibilityLabel).toBe(
      strings('activity_view.filter_date_last_7_days'),
    );
    expect(dateChip.props.accessibilityState.selected).toBe(true);
  });

  it('falls back to the default chip labels and unselected state', () => {
    const { getByTestId } = renderControlBar();

    const typeChip = getByTestId(ActivitiesViewSelectorsIDs.TYPE_FILTER_CHIP);

    expect(typeChip.props.accessibilityLabel).toBe(
      strings('activity_view.filter_type'),
    );
    expect(typeChip.props.accessibilityState.selected).toBe(false);
  });

  it('hides the active filter row until a filter is applied', () => {
    const { queryAllByTestId, queryByTestId } = renderControlBar();

    expect(
      queryAllByTestId(ActivitiesViewSelectorsIDs.ACTIVE_FILTER_TOKEN),
    ).toHaveLength(0);
    expect(
      queryByTestId(ActivitiesViewSelectorsIDs.CLEAR_ALL_FILTERS),
    ).toBeNull();
  });

  it('renders one dismissible token per active filter', () => {
    const { getAllByTestId, getByLabelText } = renderControlBar({
      filters: {
        ...EMPTY_ACTIVITY_FILTER_STATE,
        types: [ActivityTypeCategory.Send],
        statuses: [ActivityStatusCategory.Pending],
        dateRange: { preset: DateRangePreset.ThisYear },
      },
      isFiltered: true,
    });

    expect(
      getAllByTestId(ActivitiesViewSelectorsIDs.ACTIVE_FILTER_TOKEN),
    ).toHaveLength(3);

    fireEvent.press(
      getByLabelText(
        strings('activity_view.remove_filter', {
          filter: strings('activity_view.filter_type_send'),
        }),
      ),
    );
    expect(defaultProps.onTypesChange).toHaveBeenCalledWith([]);

    fireEvent.press(
      getByLabelText(
        strings('activity_view.remove_filter', {
          filter: strings('activity_view.filter_status_pending'),
        }),
      ),
    );
    expect(defaultProps.onStatusesChange).toHaveBeenCalledWith([]);

    fireEvent.press(
      getByLabelText(
        strings('activity_view.remove_filter', {
          filter: strings('activity_view.filter_date_this_year'),
        }),
      ),
    );
    expect(defaultProps.onDateRangeChange).toHaveBeenCalledWith(undefined);
  });

  it('clears every filter from the clear all action', () => {
    const { getByTestId } = renderControlBar({
      filters: {
        ...EMPTY_ACTIVITY_FILTER_STATE,
        types: [ActivityTypeCategory.Send],
      },
      isFiltered: true,
    });

    fireEvent.press(getByTestId(ActivitiesViewSelectorsIDs.CLEAR_ALL_FILTERS));

    expect(defaultProps.onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('disables the controls while the list is loading', () => {
    const { getByTestId } = renderControlBar({ isDisabled: true });

    const typeChip = getByTestId(ActivitiesViewSelectorsIDs.TYPE_FILTER_CHIP);
    fireEvent.press(typeChip);

    expect(typeChip.props.accessibilityState.disabled).toBe(true);
    expect(defaultProps.onOpenSheet).not.toHaveBeenCalled();
  });
});
