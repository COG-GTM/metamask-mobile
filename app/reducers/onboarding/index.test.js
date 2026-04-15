import onboardingReducer from '.';
import {
  CLEAR_EVENTS,
  SAVE_EVENT,
  SET_COMPLETED_ONBOARDING } from
'../../actions/onboarding';


describe('onboardingReducer', () => {
  const initialState = {
    events: [],
    completedOnboarding: false
  };

  it('returns the initial state when no action is provided', () => {
    const state = onboardingReducer(undefined, { type: null });
    expect(state).toEqual(initialState);
  });

  it('handles the SAVE_EVENT action', () => {
    const mockEvent = [{ name: 'test_event' }];
    const action = { type: SAVE_EVENT, event: mockEvent };
    const state = onboardingReducer(initialState, action);
    expect(state.events).toEqual([mockEvent]);
  });

  it('handles the CLEAR_EVENTS action', () => {
    const stateWithEvents = {
      ...initialState,
      events: [[{ name: 'test_event' }]]
    };
    const action = { type: CLEAR_EVENTS };
    const state = onboardingReducer(stateWithEvents, action);
    expect(state.events).toEqual([]);
  });

  it('handle the SET_COMPLETED_ONBOARDING action', () => {
    const action = {
      type: SET_COMPLETED_ONBOARDING,
      completedOnboarding: true
    };
    const state = onboardingReducer(initialState, action);
    expect(state.completedOnboarding).toBe(true);
  });
});