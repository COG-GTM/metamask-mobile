import { useCallback } from 'react';

import { MetaMetrics, MetaMetricsEvents } from '../../../../core/Analytics';
import { MetricsEventBuilder } from '../../../../core/Analytics/MetricsEventBuilder';

export function trackEvent(
eventType,
params)
{
  const metrics = MetaMetrics.getInstance();
  metrics.trackEvent(MetricsEventBuilder.createEventBuilder(
    MetaMetricsEvents[eventType]
  ).
  addProperties({ ...params }).
  build()
  );
}

function useAnalytics() {
  return useCallback(
    (
    eventType,
    params) =>
    {
      trackEvent(eventType, params);
    },
    []
  );
}

export default useAnalytics;