import { useCallback, useEffect, useRef } from 'react';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { useMetrics } from '../useMetrics';
import { useDebouncedValue } from '../useDebouncedValue';
import {
  ActivityFilterCategory,
  ActivityFiltersClearedVia,
  buildActivityExportCsvProperties,
  buildActivityFilterAppliedProperties,
  buildActivityFiltersClearedProperties,
  buildActivitySearchProperties,
} from './analytics';
import {
  ActivityFilterState,
  ActivityStatusCategory,
  ActivityTypeCategory,
} from './types';
import { normalizeQuery } from './utils';
import { SEARCH_DEBOUNCE_MS } from './useActivityFilters';

interface UseActivityFilterAnalyticsResult {
  trackFilterApplied: (
    category: ActivityFilterCategory,
    selection: (ActivityTypeCategory | ActivityStatusCategory | string)[],
    resultCount: number,
  ) => void;
  trackFiltersCleared: (via: ActivityFiltersClearedVia) => void;
  trackExportCsv: (rowCount: number) => void;
}

/**
 * Fires the activity search and filter MetaMetrics events.
 *
 * The search event is emitted once per settled query — the query is debounced
 * with the same delay the filter hook uses, so typing "usdc" produces one
 * event, not four. No event property ever carries the query text itself.
 */
export const useActivityFilterAnalytics = (
  filters: ActivityFilterState,
  resultCount: number,
): UseActivityFilterAnalyticsResult => {
  const { trackEvent, createEventBuilder } = useMetrics();

  const debouncedQuery = useDebouncedValue(filters.query, SEARCH_DEBOUNCE_MS);
  const settledQuery = normalizeQuery(debouncedQuery);
  const lastTrackedQuery = useRef<string>('');

  // Read through refs so the search effect depends on the settled query alone
  // and does not re-fire when the result count or the chips change.
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const resultCountRef = useRef(resultCount);
  resultCountRef.current = resultCount;

  useEffect(() => {
    if (!settledQuery || settledQuery === lastTrackedQuery.current) {
      lastTrackedQuery.current = settledQuery;
      return;
    }
    lastTrackedQuery.current = settledQuery;

    trackEvent(
      createEventBuilder(MetaMetricsEvents.ACTIVITY_SEARCH_USED)
        .addProperties(
          buildActivitySearchProperties(
            settledQuery,
            resultCountRef.current,
            filtersRef.current,
          ),
        )
        .build(),
    );
  }, [settledQuery, trackEvent, createEventBuilder]);

  const trackFilterApplied = useCallback(
    (
      category: ActivityFilterCategory,
      selection: (ActivityTypeCategory | ActivityStatusCategory | string)[],
      count: number,
    ) => {
      trackEvent(
        createEventBuilder(MetaMetricsEvents.ACTIVITY_FILTER_APPLIED)
          .addProperties(
            buildActivityFilterAppliedProperties(category, selection, count),
          )
          .build(),
      );
    },
    [trackEvent, createEventBuilder],
  );

  const trackFiltersCleared = useCallback(
    (via: ActivityFiltersClearedVia) => {
      trackEvent(
        createEventBuilder(MetaMetricsEvents.ACTIVITY_FILTERS_CLEARED)
          .addProperties(buildActivityFiltersClearedProperties(via))
          .build(),
      );
    },
    [trackEvent, createEventBuilder],
  );

  const trackExportCsv = useCallback(
    (rowCount: number) => {
      trackEvent(
        createEventBuilder(MetaMetricsEvents.ACTIVITY_EXPORT_CSV)
          .addProperties(
            buildActivityExportCsvProperties(rowCount, filtersRef.current),
          )
          .build(),
      );
    },
    [trackEvent, createEventBuilder],
  );

  return { trackFilterApplied, trackFiltersCleared, trackExportCsv };
};
