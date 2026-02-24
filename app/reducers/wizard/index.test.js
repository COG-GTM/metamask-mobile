import onboardingWizardReducer from './';
import { REHYDRATE } from 'redux-persist';

const initialState = {
  step: 0,
};

describe('onboardingWizardReducer', () => {
  it('returns initial state', () => {
    const state = onboardingWizardReducer(undefined, { type: 'INIT' });
    expect(state).toEqual(initialState);
  });

  it('handles REHYDRATE by resetting to initial state', () => {
    const modifiedState = { step: 3 };
    const state = onboardingWizardReducer(modifiedState, { type: REHYDRATE });
    expect(state).toEqual(initialState);
  });

  it('handles SET_ONBOARDING_WIZARD_STEP', () => {
    const state = onboardingWizardReducer(initialState, {
      type: 'SET_ONBOARDING_WIZARD_STEP',
      step: 5,
    });
    expect(state.step).toBe(5);
  });

  it('returns current state for unknown action', () => {
    const state = onboardingWizardReducer(initialState, { type: 'UNKNOWN' });
    expect(state).toEqual(initialState);
  });
});
