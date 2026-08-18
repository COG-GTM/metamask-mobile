import { act, renderHook } from '@testing-library/react-hooks';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';
import { ITrackingEvent } from '../../../core/Analytics/MetaMetrics.types';
import { useActivityFilterAnalytics } from './useActivityFilterAnalytics';
import { ActivityFilterCategory, ActivityFiltersClearedVia } from './analytics';
import {
  ActivityFilterState,
  ActivityTypeCategory,
  EMPTY_ACTIVITY_FILTER_STATE,
} from './types';
import { SEARCH_DEBOUNCE_MS } from './useActivityFilters';

const mockTrackEvent = jest.fn();

jest.mock('../useMetrics', () => ({
  useMetrics: () => ({
    trackEvent: mockTrackEvent,
    createEventBuilder: jest.requireActual(
      '../../../core/Analytics/MetricsEventBuilder',
    ).MetricsEventBuilder.createEventBuilder,
  }),
}));

const trackedEvents = (): ITrackingEvent[] =>
  mockTrackEvent.mock.calls.map(([event]) => event);

const filtersWith = (
  overrides: Partial<ActivityFilterState>,
): ActivityFilterState => ({ ...EMPTY_ACTIVITY_FILTER_STATE, ...overrides });

describe('useActivityFilterAnalytics', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockTrackEvent.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const settle = () => {
    act(() => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
  };

  it('emits one search event per settled query, not per keystroke', () => {
    const { rerender } = renderHook(
      ({ filters, count }: { filters: ActivityFilterState; count: number }) =>
        useActivityFilterAnalytics(filters, count),
      {
        initialProps: {
          filters: EMPTY_ACTIVITY_FILTER_STATE,
          count: 10,
        },
      },
    );

    ['u', 'us', 'usd', 'usdc'].forEach((query) => {
      rerender({ filters: filtersWith({ query }), count: 3 });
    });
    settle();

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    const [event] = trackedEvents();
    expect(event.name).toBe('Activity Search Used');
    expect(event.properties).toStrictEqual({
      query_length: 4,
      has_query: true,
      result_count: 3,
      had_filters: false,
    });
  });

  it('does not emit a search event for a query below the minimum length', () => {
    const { rerender } = renderHook(
      ({ filters }: { filters: ActivityFilterState }) =>
        useActivityFilterAnalytics(filters, 10),
      { initialProps: { filters: EMPTY_ACTIVITY_FILTER_STATE } },
    );

    rerender({ filters: filtersWith({ query: 'u' }) });
    settle();

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('emits a second event when the query settles on a new value', () => {
    const { rerender } = renderHook(
      ({ filters }: { filters: ActivityFilterState }) =>
        useActivityFilterAnalytics(filters, 2),
      { initialProps: { filters: EMPTY_ACTIVITY_FILTER_STATE } },
    );

    rerender({ filters: filtersWith({ query: 'usdc' }) });
    settle();
    rerender({ filters: filtersWith({ query: 'dai' }) });
    settle();

    expect(mockTrackEvent).toHaveBeenCalledTimes(2);
  });

  it('never sends the query text on the search event', () => {
    const query = '0x1234567890abcdef1234567890abcdef12345678';
    const { rerender } = renderHook(
      ({ filters }: { filters: ActivityFilterState }) =>
        useActivityFilterAnalytics(filters, 1),
      { initialProps: { filters: EMPTY_ACTIVITY_FILTER_STATE } },
    );

    rerender({ filters: filtersWith({ query }) });
    settle();

    const [event] = trackedEvents();
    expect(JSON.stringify(event.properties)).not.toContain(query);
  });

  it('tracks filter applied, filters cleared and CSV export', () => {
    const filters = filtersWith({
      query: 'usdc',
      types: [ActivityTypeCategory.Swap],
    });
    const { result } = renderHook(() => useActivityFilterAnalytics(filters, 5));

    act(() => {
      result.current.trackFilterApplied(
        ActivityFilterCategory.Type,
        [ActivityTypeCategory.Swap],
        5,
      );
      result.current.trackFiltersCleared(ActivityFiltersClearedVia.ClearAll);
      result.current.trackExportCsv(5);
    });

    const events = trackedEvents().filter(
      (event) => event.name !== 'Activity Search Used',
    );
    expect(events.map((event) => event.name)).toStrictEqual([
      'Activity Filter Applied',
      'Activity Filters Cleared',
      'Activity Export CSV',
    ]);
    expect(events[0].properties).toStrictEqual({
      filter_category: 'type',
      selected_count: 1,
      result_count: 5,
    });
    expect(events[1].properties).toStrictEqual({ via: 'clear_all' });
    expect(events[2].properties).toStrictEqual({
      row_count: 5,
      had_filters: true,
    });
  });
});

describe('MetricsEventBuilder integration', () => {
  it('builds an event whose properties are plain JSON', () => {
    const event = MetricsEventBuilder.createEventBuilder({
      category: 'Activity Search Used',
    })
      .addProperties({ query_length: 4 })
      .build();

    expect(event.properties).toStrictEqual({ query_length: 4 });
    expect(event.isAnonymous).toBe(false);
  });
});
