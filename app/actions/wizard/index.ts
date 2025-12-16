interface SetOnboardingWizardStepAction {
  type: 'SET_ONBOARDING_WIZARD_STEP';
  step: number;
}

export type WizardAction = SetOnboardingWizardStepAction;

export default function setOnboardingWizardStep(
  step: number,
): SetOnboardingWizardStepAction {
  return {
    type: 'SET_ONBOARDING_WIZARD_STEP',
    step,
  };
}
