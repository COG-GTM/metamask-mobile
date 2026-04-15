import { MetaMetrics } from '../../../core/Analytics';
import { InteractionManager } from 'react-native';


/**
 * track onboarding event or save it for when metrics are enabled
 * @param event - the event to track
 * @param properties - the properties map for the event
 * @param saveOnboardingEvent - function to store onboarding event before optin
 */
const trackOnboarding = (
event,
saveOnboardingEvent) =>
{
  InteractionManager.runAfterInteractions(async () => {
    const metrics = MetaMetrics.getInstance();
    const isOnboardingDelayedEvent =
    !metrics.isEnabled() && saveOnboardingEvent;
    if (isOnboardingDelayedEvent) {
      saveOnboardingEvent(event);
    } else {
      metrics.trackEvent(event);
    }
  });
};

export default trackOnboarding;