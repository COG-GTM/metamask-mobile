/**
 * Sets onboarding wizard step
 */

interface SetOnboardingWizardStepAction {
  type: 'SET_ONBOARDING_WIZARD_STEP';
  step: number | boolean;
}

export default function setOnboardingWizardStep(
  step: number | boolean,
): SetOnboardingWizardStepAction {
  return {
    type: 'SET_ONBOARDING_WIZARD_STEP',
    step,
  };
}
