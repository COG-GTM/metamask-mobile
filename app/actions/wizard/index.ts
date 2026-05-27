interface SetOnboardingWizardStepAction {
  type: 'SET_ONBOARDING_WIZARD_STEP';
  step: number;
}

export default function setOnboardingWizardStep(step: number): SetOnboardingWizardStepAction {
  return {
    type: 'SET_ONBOARDING_WIZARD_STEP',
    step,
  };
}
