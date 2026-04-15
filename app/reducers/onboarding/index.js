/* eslint-disable @typescript-eslint/default-param-last */

import {
  CLEAR_EVENTS,

  SAVE_EVENT,
  SET_COMPLETED_ONBOARDING } from
'../../actions/onboarding';







export const initialOnboardingState = {
  events: [],
  completedOnboarding: false
};

/**
 * Reducer to keep track of user oboarding actions:
 * - send it to analytics if the user decides to optin after finishing onboarding flow
 * - update the state of the onboarding flow
 */
const onboardingReducer = (
state = initialOnboardingState,
action) =>
{
  switch (action.type) {
    case SAVE_EVENT:
      return {
        ...state,
        events: [...state.events, action.event]
      };
    case CLEAR_EVENTS:
      return {
        ...state,
        events: []
      };
    case SET_COMPLETED_ONBOARDING:
      return {
        ...state,
        completedOnboarding: action.completedOnboarding
      };
    default:
      return state;
  }
};

export default onboardingReducer;