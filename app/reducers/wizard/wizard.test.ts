import { REHYDRATE } from 'redux-persist';
import onboardingWizardReducer from './index';
import setOnboardingWizardStep from '../../actions/wizard';

describe('onboardingWizardReducer', () => {
  it('returns the initial state', () => {
    expect(onboardingWizardReducer(undefined, { type: 'UNKNOWN' })).toEqual({
      step: 0,
    });
  });

  it('sets the step', () => {
    const state = onboardingWizardReducer(
      undefined,
      setOnboardingWizardStep(3),
    );
    expect(state.step).toBe(3);
  });

  it('resets on rehydrate', () => {
    const state = onboardingWizardReducer({ step: 4 }, { type: REHYDRATE });
    expect(state).toEqual({ step: 0 });
  });

  it('creates the action', () => {
    expect(setOnboardingWizardStep(2)).toEqual({
      type: 'SET_ONBOARDING_WIZARD_STEP',
      step: 2,
    });
  });
});
