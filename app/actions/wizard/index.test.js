import setOnboardingWizardStep from './';

describe('Wizard Actions', () => {
  describe('setOnboardingWizardStep', () => {
    it('returns SET_ONBOARDING_WIZARD_STEP action', () => {
      expect(setOnboardingWizardStep(3)).toEqual({
        type: 'SET_ONBOARDING_WIZARD_STEP',
        step: 3,
      });
    });

    it('returns SET_ONBOARDING_WIZARD_STEP with step 0', () => {
      expect(setOnboardingWizardStep(0)).toEqual({
        type: 'SET_ONBOARDING_WIZARD_STEP',
        step: 0,
      });
    });
  });
});
