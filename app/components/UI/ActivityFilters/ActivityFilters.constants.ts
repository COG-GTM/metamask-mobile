// External dependencies.
import {
  ACTIVITY_TYPE_LABEL_KEYS,
  ActivityStatusCategory,
  ActivityTypeCategory,
  DateRangePreset,
} from '../../hooks/useActivityFilters';

export { ACTIVITY_TYPE_LABEL_KEYS };

/**
 * Order the type options are presented in, matching the order the categories
 * are documented in the activity filter types.
 */
export const ACTIVITY_TYPE_OPTIONS: ActivityTypeCategory[] = [
  ActivityTypeCategory.Send,
  ActivityTypeCategory.Receive,
  ActivityTypeCategory.Swap,
  ActivityTypeCategory.Bridge,
  ActivityTypeCategory.Approve,
  ActivityTypeCategory.ContractInteraction,
];

export const ACTIVITY_STATUS_OPTIONS: ActivityStatusCategory[] = [
  ActivityStatusCategory.Pending,
  ActivityStatusCategory.Confirmed,
  ActivityStatusCategory.Failed,
];

export const ACTIVITY_DATE_PRESET_OPTIONS: DateRangePreset[] = [
  DateRangePreset.Last7Days,
  DateRangePreset.Last30Days,
  DateRangePreset.Last90Days,
  DateRangePreset.ThisYear,
  DateRangePreset.Custom,
];

export const ACTIVITY_STATUS_LABEL_KEYS: Record<
  ActivityStatusCategory,
  string
> = {
  [ActivityStatusCategory.Pending]: 'activity_view.filter_status_pending',
  [ActivityStatusCategory.Confirmed]: 'activity_view.filter_status_confirmed',
  [ActivityStatusCategory.Failed]: 'activity_view.filter_status_failed',
};

export const ACTIVITY_DATE_LABEL_KEYS: Record<DateRangePreset, string> = {
  [DateRangePreset.Last7Days]: 'activity_view.filter_date_last_7_days',
  [DateRangePreset.Last30Days]: 'activity_view.filter_date_last_30_days',
  [DateRangePreset.Last90Days]: 'activity_view.filter_date_last_90_days',
  [DateRangePreset.ThisYear]: 'activity_view.filter_date_this_year',
  [DateRangePreset.Custom]: 'activity_view.filter_date_custom',
};

/** Which filter category a bottom sheet is currently editing, if any. */
export enum ActivityFilterSheet {
  Type = 'type',
  Status = 'status',
  Date = 'date',
}
