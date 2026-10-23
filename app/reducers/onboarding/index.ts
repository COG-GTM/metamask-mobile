import { createSlice, Draft } from '@reduxjs/toolkit';
import {
  ActionType,
  ClearEventsAction,
  SaveEventAction,
  SetCompletedOnboardingAction,
} from '../../actions/onboarding';
import { ITrackingEvent } from '../../core/Analytics/MetaMetrics.types';

export interface OnboardingState {
  events: [ITrackingEvent][];
  completedOnboarding: boolean;
}

export const initialOnboardingState: OnboardingState = {
  events: [],
  completedOnboarding: false,
};

export const initialState = initialOnboardingState;

// Draft<ITrackingEvent> recurses through JsonMap past TypeScript's comparison
// depth, so case reducers read the draft through the plain state type.
const asState = (state: Draft<OnboardingState>) =>
  state as unknown as OnboardingState;

/**
 * Slice to keep track of user oboarding actions:
 * - send it to analytics if the user decides to optin after finishing onboarding flow
 * - update the state of the onboarding flow
 *
 * Legacy action types from app/actions/onboarding are handled in extraReducers
 * so the dispatched action objects keep their existing shape.
 */
const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(
        ActionType.SAVE_EVENT,
        (state, action: SaveEventAction): OnboardingState => ({
          ...asState(state),
          events: [...asState(state).events, action.event],
        }),
      )
      .addCase(
        ActionType.CLEAR_EVENTS,
        (state, _action: ClearEventsAction): OnboardingState => ({
          ...asState(state),
          events: [],
        }),
      )
      .addCase(
        ActionType.SET_COMPLETED_ONBOARDING,
        (state, action: SetCompletedOnboardingAction): OnboardingState => ({
          ...asState(state),
          completedOnboarding: action.completedOnboarding,
        }),
      );
  },
});

export default onboardingSlice.reducer;
