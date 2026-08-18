import { JsonMap } from '../../../core/Analytics/MetaMetrics.types';
import {
  ActivityFilterState,
  ActivityStatusCategory,
  ActivityTypeCategory,
} from './types';
import { normalizeQuery, resolveDateRange } from './utils';

/**
 * Filter category a `Activity Filter Applied` event refers to.
 */
export enum ActivityFilterCategory {
  Type = 'type',
  Status = 'status',
  Date = 'date',
}

/**
 * Entry point the user cleared activity filters from.
 */
export enum ActivityFiltersClearedVia {
  Chip = 'chip',
  ClearAll = 'clear_all',
  EmptyState = 'empty_state',
}

/**
 * Property payload for `Activity Search Used`.
 *
 * The query itself is never sent — only its length — because it routinely
 * contains addresses, ENS names and transaction hashes.
 */
export interface ActivitySearchProperties extends JsonMap {
  query_length: number;
  has_query: boolean;
  result_count: number;
  had_filters: boolean;
}

export interface ActivityFilterAppliedProperties extends JsonMap {
  filter_category: ActivityFilterCategory;
  selected_count: number;
  result_count: number;
}

export interface ActivityFiltersClearedProperties extends JsonMap {
  via: ActivityFiltersClearedVia;
}

export interface ActivityExportCsvProperties extends JsonMap {
  row_count: number;
  had_filters: boolean;
}

/**
 * True when a filter other than the free-text query is active, so the search
 * event can say whether the reported result count was narrowed by chips too.
 */
export const hasNonQueryFilters = (filters: ActivityFilterState): boolean =>
  filters.types.length > 0 ||
  filters.statuses.length > 0 ||
  Boolean(resolveDateRange(filters.dateRange));

export const buildActivitySearchProperties = (
  query: string,
  resultCount: number,
  filters: ActivityFilterState,
): ActivitySearchProperties => {
  const normalized = normalizeQuery(query);
  return {
    query_length: normalized.length,
    has_query: normalized.length > 0,
    result_count: resultCount,
    had_filters: hasNonQueryFilters(filters),
  };
};

export const buildActivityFilterAppliedProperties = (
  category: ActivityFilterCategory,
  selection: (ActivityTypeCategory | ActivityStatusCategory | string)[],
  resultCount: number,
): ActivityFilterAppliedProperties => ({
  filter_category: category,
  selected_count: selection.length,
  result_count: resultCount,
});

export const buildActivityFiltersClearedProperties = (
  via: ActivityFiltersClearedVia,
): ActivityFiltersClearedProperties => ({ via });

export const buildActivityExportCsvProperties = (
  rowCount: number,
  filters: ActivityFilterState,
): ActivityExportCsvProperties => ({
  row_count: rowCount,
  had_filters:
    hasNonQueryFilters(filters) || Boolean(normalizeQuery(filters.query)),
});
