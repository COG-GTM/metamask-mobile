import setOnboardingWizardStep from '.';

describe('Wizard Actions', () => {
  it('should return SET_ONBOARDING_WIZARD_STEP action with step', () => {
    expect(setOnboardingWizardStep(1)).toStrictEqual({
      type: 'SET_ONBOARDING_WIZARD_STEP',
      step: 1,
    });
  });

  it('should handle step 0', () => {
    expect(setOnboardingWizardStep(0)).toStrictEqual({
      type: 'SET_ONBOARDING_WIZARD_STEP',
      step: 0,
    });
  });

  it('should handle large step numbers', () => {
    expect(setOnboardingWizardStep(10)).toStrictEqual({
      type: 'SET_ONBOARDING_WIZARD_STEP',
      step: 10,
    });
  });
});
