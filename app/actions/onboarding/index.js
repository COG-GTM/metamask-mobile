

export const SAVE_EVENT = 'SAVE_EVENT';
export const CLEAR_EVENTS = 'CLEAR_EVENTS';
export const SET_COMPLETED_ONBOARDING = 'SET_COMPLETED_ONBOARDING';




















export function saveOnboardingEvent(
eventArgs)
{
  return {
    type: SAVE_EVENT,
    event: eventArgs
  };
}

export function clearOnboardingEvents() {
  return {
    type: CLEAR_EVENTS
  };
}

export function setCompletedOnboarding(
completedOnboarding)
{
  return {
    type: SET_COMPLETED_ONBOARDING,
    completedOnboarding
  };
}