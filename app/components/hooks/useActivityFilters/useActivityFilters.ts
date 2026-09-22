import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { strings } from '../../../../locales/i18n';
import { selectTokens } from '../../../selectors/tokensController';
import { selectNetworkConfigurations } from '../../../selectors/networkController';
import { useDebouncedValue } from '../useDebouncedValue';
import {
  ActivityFilterState,
  ActivityStatusCategory,
  ActivityTypeCategory,
  ActivityDateRange,
  EMPTY_ACTIVITY_FILTER_STATE,
  FilterableTransaction,
  SearchIndexContext,
} from './types';
import {
  applyActivityFilters,
  buildSearchIndexMap,
  isActivityFilterActive,
} from './utils';

export const SEARCH_DEBOUNCE_MS = 250;

export const ACTIVITY_TYPE_LABEL_KEYS: Record<ActivityTypeCategory, string> = {
  [ActivityTypeCategory.Send]: 'activity_view.filter_type_send',
  [ActivityTypeCategory.Receive]: 'activity_view.filter_type_receive',
  [ActivityTypeCategory.Swap]: 'activity_view.filter_type_swap',
  [ActivityTypeCategory.Bridge]: 'activity_view.filter_type_bridge',
  [ActivityTypeCategory.Approve]: 'activity_view.filter_type_approve',
  [ActivityTypeCategory.ContractInteraction]:
    'activity_view.filter_type_contract_interaction',
};

interface UseActivityFiltersResult {
  filters: ActivityFilterState;
  isFiltered: boolean;
  setQuery: (query: string) => void;
  setTypes: (types: ActivityTypeCategory[]) => void;
  setStatuses: (statuses: ActivityStatusCategory[]) => void;
  setDateRange: (dateRange?: ActivityDateRange) => void;
  clearFilters: () => void;
  filteredTransactions: FilterableTransaction[];
  filteredSubmittedTransactions: FilterableTransaction[];
  filteredConfirmedTransactions: FilterableTransaction[];
  resultCount: number;
}

/**
 * Owns activity filter state and applies it to the three transaction lists the
 * activity screen renders. Filtering is pure and synchronous — no network
 * requests — and the search index is rebuilt only when the underlying lists
 * change, not on every keystroke.
 */
export const useActivityFilters = (
  transactions: FilterableTransaction[],
  submittedTransactions: FilterableTransaction[],
  confirmedTransactions: FilterableTransaction[],
  selectedAddress: string,
): UseActivityFiltersResult => {
  const [filters, setFilters] = useState<ActivityFilterState>(
    EMPTY_ACTIVITY_FILTER_STATE,
  );

  const tokens = useSelector(selectTokens);
  const networkConfigurations = useSelector(selectNetworkConfigurations);

  const debouncedQuery = useDebouncedValue(filters.query, SEARCH_DEBOUNCE_MS);

  const context = useMemo<SearchIndexContext>(
    () => ({
      selectedAddress,
      tokenLabelsByAddress: (tokens ?? []).reduce<Record<string, string>>(
        (acc, token) => {
          if (token?.address) {
            acc[token.address.toLowerCase()] = [token.symbol, token.name]
              .filter(Boolean)
              .join(' ');
          }
          return acc;
        },
        {},
      ),
      networkNamesByChainId: Object.entries(networkConfigurations ?? {}).reduce<
        Record<string, string>
      >((acc, [chainId, configuration]) => {
        acc[chainId] = configuration?.name ?? '';
        return acc;
      }, {}),
      typeLabels: Object.entries(ACTIVITY_TYPE_LABEL_KEYS).reduce(
        (acc, [category, key]) => ({
          ...acc,
          [category]: strings(key),
        }),
        {} as Record<ActivityTypeCategory, string>,
      ),
    }),
    [selectedAddress, tokens, networkConfigurations],
  );

  const allListed = useMemo(
    () => [...transactions, ...submittedTransactions, ...confirmedTransactions],
    [transactions, submittedTransactions, confirmedTransactions],
  );

  const searchIndex = useMemo(
    () => buildSearchIndexMap(allListed, context),
    [allListed, context],
  );

  const effectiveFilters = useMemo(
    () => ({ ...filters, query: debouncedQuery }),
    [filters, debouncedQuery],
  );

  const isFiltered = useMemo(
    () => isActivityFilterActive(effectiveFilters),
    [effectiveFilters],
  );

  const filterList = useCallback(
    (list: FilterableTransaction[]) =>
      isFiltered
        ? applyActivityFilters(
            list,
            effectiveFilters,
            searchIndex,
            selectedAddress,
          )
        : list,
    [isFiltered, effectiveFilters, searchIndex, selectedAddress],
  );

  const filteredTransactions = useMemo(
    () => filterList(transactions),
    [filterList, transactions],
  );
  const filteredSubmittedTransactions = useMemo(
    () => filterList(submittedTransactions),
    [filterList, submittedTransactions],
  );
  const filteredConfirmedTransactions = useMemo(
    () => filterList(confirmedTransactions),
    [filterList, confirmedTransactions],
  );

  const setQuery = useCallback(
    (query: string) => setFilters((current) => ({ ...current, query })),
    [],
  );
  const setTypes = useCallback(
    (types: ActivityTypeCategory[]) =>
      setFilters((current) => ({ ...current, types })),
    [],
  );
  const setStatuses = useCallback(
    (statuses: ActivityStatusCategory[]) =>
      setFilters((current) => ({ ...current, statuses })),
    [],
  );
  const setDateRange = useCallback(
    (dateRange?: ActivityDateRange) =>
      setFilters((current) => ({ ...current, dateRange })),
    [],
  );
  const clearFilters = useCallback(
    () => setFilters(EMPTY_ACTIVITY_FILTER_STATE),
    [],
  );

  return {
    filters,
    isFiltered,
    setQuery,
    setTypes,
    setStatuses,
    setDateRange,
    clearFilters,
    filteredTransactions,
    filteredSubmittedTransactions,
    filteredConfirmedTransactions,
    resultCount:
      filteredTransactions.length + filteredSubmittedTransactions.length,
  };
};

export default useActivityFilters;
