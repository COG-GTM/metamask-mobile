import { REHYDRATE } from 'redux-persist';
import onboardingWizardReducer, { initialState } from '.';
import setOnboardingWizardStep from '../../actions/wizard';

describe('onboardingWizardReducer', () => {
  it('returns the initial state by default', () => {
    expect(
      onboardingWizardReducer(undefined, { type: 'UNKNOWN' } as never),
    ).toEqual(initialState);
  });

  it('handles SET_ONBOARDING_WIZARD_STEP', () => {
    expect(
      onboardingWizardReducer(initialState, setOnboardingWizardStep(3)),
    ).toEqual({ step: 3 });
  });

  it('resets to the initial state on REHYDRATE', () => {
    expect(
      onboardingWizardReducer({ step: 4 }, { type: REHYDRATE }),
    ).toEqual(initialState);
  });
});
