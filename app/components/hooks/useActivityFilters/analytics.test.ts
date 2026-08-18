import {
  ActivityFilterCategory,
  ActivityFiltersClearedVia,
  buildActivityExportCsvProperties,
  buildActivityFilterAppliedProperties,
  buildActivityFiltersClearedProperties,
  buildActivitySearchProperties,
  hasNonQueryFilters,
} from './analytics';
import {
  ActivityFilterState,
  ActivityStatusCategory,
  ActivityTypeCategory,
  DateRangePreset,
  EMPTY_ACTIVITY_FILTER_STATE,
} from './types';

const SENSITIVE_VALUES = [
  '0x1234567890abcdef1234567890abcdef12345678',
  '0xabc123hash',
  'alice.eth',
  '12.345',
];

const filtersWith = (
  overrides: Partial<ActivityFilterState>,
): ActivityFilterState => ({ ...EMPTY_ACTIVITY_FILTER_STATE, ...overrides });

describe('activity analytics property builders', () => {
  describe('hasNonQueryFilters', () => {
    it('is false for an empty filter state and for a query-only state', () => {
      expect(hasNonQueryFilters(EMPTY_ACTIVITY_FILTER_STATE)).toBe(false);
      expect(hasNonQueryFilters(filtersWith({ query: 'usdc' }))).toBe(false);
    });

    it('is true when a type, status or date filter is set', () => {
      expect(
        hasNonQueryFilters(filtersWith({ types: [ActivityTypeCategory.Swap] })),
      ).toBe(true);
      expect(
        hasNonQueryFilters(
          filtersWith({ statuses: [ActivityStatusCategory.Failed] }),
        ),
      ).toBe(true);
      expect(
        hasNonQueryFilters(
          filtersWith({ dateRange: { preset: DateRangePreset.Last7Days } }),
        ),
      ).toBe(true);
    });
  });

  describe('buildActivitySearchProperties', () => {
    it('reports the normalised query length, result count and filter state', () => {
      expect(
        buildActivitySearchProperties(
          '  UsdC  ',
          7,
          filtersWith({ types: [ActivityTypeCategory.Send] }),
        ),
      ).toStrictEqual({
        query_length: 4,
        has_query: true,
        result_count: 7,
        had_filters: true,
      });
    });

    it('treats a query below the minimum length as no query', () => {
      expect(
        buildActivitySearchProperties('a', 12, EMPTY_ACTIVITY_FILTER_STATE),
      ).toStrictEqual({
        query_length: 0,
        has_query: false,
        result_count: 12,
        had_filters: false,
      });
    });

    it.each(SENSITIVE_VALUES)(
      'never leaks the raw query (%s) into the payload',
      (value) => {
        const properties = buildActivitySearchProperties(
          value,
          1,
          filtersWith({ query: value }),
        );

        expect(JSON.stringify(properties)).not.toContain(value);
        expect(
          Object.values(properties).every((v) => typeof v !== 'string'),
        ).toBe(true);
      },
    );
  });

  describe('buildActivityFilterAppliedProperties', () => {
    it('reports the category and how many options are selected, never which', () => {
      const properties = buildActivityFilterAppliedProperties(
        ActivityFilterCategory.Type,
        [ActivityTypeCategory.Send, ActivityTypeCategory.Swap],
        3,
      );

      expect(properties).toStrictEqual({
        filter_category: 'type',
        selected_count: 2,
        result_count: 3,
      });
    });

    it('reports zero selections when a category is emptied', () => {
      expect(
        buildActivityFilterAppliedProperties(
          ActivityFilterCategory.Status,
          [],
          20,
        ),
      ).toStrictEqual({
        filter_category: 'status',
        selected_count: 0,
        result_count: 20,
      });
    });
  });

  it('builds the cleared payload with only the entry point', () => {
    expect(
      buildActivityFiltersClearedProperties(ActivityFiltersClearedVia.ClearAll),
    ).toStrictEqual({ via: 'clear_all' });
    expect(
      buildActivityFiltersClearedProperties(
        ActivityFiltersClearedVia.EmptyState,
      ),
    ).toStrictEqual({ via: 'empty_state' });
  });

  describe('buildActivityExportCsvProperties', () => {
    it('counts rows and flags a query as a filter', () => {
      expect(
        buildActivityExportCsvProperties(
          42,
          filtersWith({ query: 'alice.eth' }),
        ),
      ).toStrictEqual({ row_count: 42, had_filters: true });
    });

    it('flags an unfiltered export', () => {
      expect(
        buildActivityExportCsvProperties(42, EMPTY_ACTIVITY_FILTER_STATE),
      ).toStrictEqual({ row_count: 42, had_filters: false });
    });
  });

  it('emits no free-text property across every builder', () => {
    const query = SENSITIVE_VALUES[0];
    const filters = filtersWith({
      query,
      types: [ActivityTypeCategory.Approve],
    });

    const payloads = [
      buildActivitySearchProperties(query, 1, filters),
      buildActivityFilterAppliedProperties(
        ActivityFilterCategory.Date,
        [DateRangePreset.ThisYear],
        1,
      ),
      buildActivityFiltersClearedProperties(ActivityFiltersClearedVia.Chip),
      buildActivityExportCsvProperties(1, filters),
    ];

    const allowedStrings = [
      'type',
      'status',
      'date',
      'chip',
      'clear_all',
      'empty_state',
    ];

    payloads.forEach((payload) => {
      Object.values(payload).forEach((value) => {
        if (typeof value === 'string') {
          expect(allowedStrings).toContain(value);
        }
      });
      SENSITIVE_VALUES.forEach((sensitive) => {
        expect(JSON.stringify(payload)).not.toContain(sensitive);
      });
    });
  });
});
