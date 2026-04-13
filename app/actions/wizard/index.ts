export const SET_ONBOARDING_WIZARD_STEP = 'SET_ONBOARDING_WIZARD_STEP' as const;

export interface WizardAction {
  type: typeof SET_ONBOARDING_WIZARD_STEP;
  step: number;
}

/**
 * Sets onboarding wizard step
 */
export default function setOnboardingWizardStep(step: number): WizardAction {
  return {
    type: SET_ONBOARDING_WIZARD_STEP,
    step,
  };
}
