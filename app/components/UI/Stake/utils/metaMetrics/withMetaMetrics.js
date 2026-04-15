



import { MetricsEventBuilder } from '../../../../../core/Analytics/MetricsEventBuilder';
import { MetaMetrics } from '../../../../../core/Analytics';






const createEventBuilder = MetricsEventBuilder.createEventBuilder;

const shouldAddProperties = (properties) => {
  if (!properties) return false;
  return Object.keys(properties).length > 0;
};

const buildEvent = (e) => {
  const eventBuilder = createEventBuilder(e.event);

  if (shouldAddProperties(e?.properties)) {
    eventBuilder.addProperties(e.properties);
  }

  return eventBuilder.build();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const withMetaMetrics = (
func,
events) =>
{
  if (!Array.isArray(events)) {
    events = [events];
  }

  const builtEvents = events.map((event) => buildEvent(event));

  return (...args) => {
    const result = func(...args);

    if (result instanceof Promise) {
      return result.then((res) => {
        builtEvents.forEach((event) =>
        MetaMetrics.getInstance().trackEvent(event)
        );
        return res;
      });
    }

    builtEvents.forEach((event) => MetaMetrics.getInstance().trackEvent(event));

    return result;
  };
};