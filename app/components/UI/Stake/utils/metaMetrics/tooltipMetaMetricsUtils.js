import { MetricsEventBuilder } from '../../../../../core/Analytics/MetricsEventBuilder';
import { MetaMetricsEvents } from '../../../../hooks/useMetrics';
import { EVENT_PROVIDERS } from '../../constants/events';

export const getTooltipMetricProperties = (
location,
tooltipName) => (
{
  selected_provider: EVENT_PROVIDERS.CONSENSYS,
  text: 'Tooltip Opened',
  location,
  tooltip_name: tooltipName
});

export const createTooltipOpenedEvent = (
location,
tooltipName) =>
{
  const createEventBuilder = MetricsEventBuilder.createEventBuilder;

  return createEventBuilder(MetaMetricsEvents.TOOLTIP_OPENED).
  addProperties(getTooltipMetricProperties(location, tooltipName)).
  build();
};