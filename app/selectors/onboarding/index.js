
import { createSelector } from 'reselect';

const selectOnboarding = (state) => state.onboarding;

export const selectCompletedOnboarding = createSelector(
  selectOnboarding,
  (onboardingState) => onboardingState.completedOnboarding
);