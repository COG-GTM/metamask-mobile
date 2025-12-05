export const SET_ONBOARDING_WIZARD_STEP = 'SET_ONBOARDING_WIZARD_STEP';

export interface SetOnboardingWizardStepAction {
  type: typeof SET_ONBOARDING_WIZARD_STEP;
  step: number;
}

export type WizardActionTypes = SetOnboardingWizardStepAction;

/**
 * Sets onboarding wizard step
 */
export default function setOnboardingWizardStep(
  step: number,
): SetOnboardingWizardStepAction {
  return {
    type: SET_ONBOARDING_WIZARD_STEP,
    step,
  };
}
