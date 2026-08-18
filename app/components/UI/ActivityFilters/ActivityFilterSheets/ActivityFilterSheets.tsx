// Third party dependencies.
import React, { useMemo } from 'react';

// External dependencies.
import { strings } from '../../../../../locales/i18n';
import {
  ActivityDateRange,
  ActivityFilterState,
  ActivityStatusCategory,
  ActivityTypeCategory,
} from '../../../hooks/useActivityFilters';

// Internal dependencies.
import ActivityFilterBottomSheet from '../ActivityFilterBottomSheet';
import ActivityDateFilterBottomSheet from '../ActivityDateFilterBottomSheet';
import {
  ACTIVITY_STATUS_LABEL_KEYS,
  ACTIVITY_STATUS_OPTIONS,
  ACTIVITY_TYPE_LABEL_KEYS,
  ACTIVITY_TYPE_OPTIONS,
  ActivityFilterSheet,
} from '../ActivityFilters.constants';

export interface ActivityFilterSheetsProps {
  /** Which sheet is open, or null when none is. */
  openSheet: ActivityFilterSheet | null;
  filters: ActivityFilterState;
  onTypesChange: (types: ActivityTypeCategory[]) => void;
  onStatusesChange: (statuses: ActivityStatusCategory[]) => void;
  onDateRangeChange: (dateRange?: ActivityDateRange) => void;
  onClose: () => void;
}

/**
 * Renders whichever activity filter bottom sheet is open. Kept separate from
 * the control bar because the sheets must be a sibling of the activity list,
 * not a descendant of its header.
 */
const ActivityFilterSheets = ({
  openSheet,
  filters,
  onTypesChange,
  onStatusesChange,
  onDateRangeChange,
  onClose,
}: ActivityFilterSheetsProps) => {
  const typeOptions = useMemo(
    () =>
      ACTIVITY_TYPE_OPTIONS.map((value) => ({
        value,
        label: strings(ACTIVITY_TYPE_LABEL_KEYS[value]),
      })),
    [],
  );

  const statusOptions = useMemo(
    () =>
      ACTIVITY_STATUS_OPTIONS.map((value) => ({
        value,
        label: strings(ACTIVITY_STATUS_LABEL_KEYS[value]),
      })),
    [],
  );

  switch (openSheet) {
    case ActivityFilterSheet.Type:
      return (
        <ActivityFilterBottomSheet
          title={strings('activity_view.filter_type_title')}
          options={typeOptions}
          selected={filters.types}
          onChange={onTypesChange}
          onClose={onClose}
        />
      );
    case ActivityFilterSheet.Status:
      return (
        <ActivityFilterBottomSheet
          title={strings('activity_view.filter_status_title')}
          options={statusOptions}
          selected={filters.statuses}
          onChange={onStatusesChange}
          onClose={onClose}
        />
      );
    case ActivityFilterSheet.Date:
      return (
        <ActivityDateFilterBottomSheet
          dateRange={filters.dateRange}
          onChange={onDateRangeChange}
          onClose={onClose}
        />
      );
    default:
      return null;
  }
};

export default ActivityFilterSheets;
