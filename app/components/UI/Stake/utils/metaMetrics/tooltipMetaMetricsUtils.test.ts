import {
  createTooltipOpenedEvent,
  getTooltipMetricProperties,
} from './tooltipMetaMetricsUtils';
import { EVENT_LOCATIONS, EVENT_PROVIDERS } from '../../constants/events';
import { MetaMetricsEvents } from '../../../../hooks/useMetrics';

describe('getTooltipMetricProperties', () => {
  it('returns the expected tooltip event properties', () => {
    const properties = getTooltipMetricProperties(
      EVENT_LOCATIONS.UNIT_TEST,
      'Annual Rewards',
    );

    expect(properties).toEqual({
      selected_provider: EVENT_PROVIDERS.CONSENSYS,
      text: 'Tooltip Opened',
      location: EVENT_LOCATIONS.UNIT_TEST,
      tooltip_name: 'Annual Rewards',
    });
  });
});

describe('createTooltipOpenedEvent', () => {
  it('builds a tooltip-opened analytics event carrying the tooltip properties', () => {
    const event = createTooltipOpenedEvent(
      EVENT_LOCATIONS.HOME_SCREEN,
      'APY Tooltip',
    );

    expect(event).toEqual(
      expect.objectContaining({
        name: MetaMetricsEvents.TOOLTIP_OPENED.category,
        properties: expect.objectContaining({
          selected_provider: EVENT_PROVIDERS.CONSENSYS,
          text: 'Tooltip Opened',
          location: EVENT_LOCATIONS.HOME_SCREEN,
          tooltip_name: 'APY Tooltip',
        }),
      }),
    );
  });
});
