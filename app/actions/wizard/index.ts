export const SET_ONBOARDING_WIZARD_STEP =
  'SET_ONBOARDING_WIZARD_STEP' as const;

interface SetOnboardingWizardStepAction {
  type: typeof SET_ONBOARDING_WIZARD_STEP;
  step: unknown;
}

export type Action = SetOnboardingWizardStepAction;

/**
 * Sets onboarding wizard step
 */
export default function setOnboardingWizardStep(
  step: unknown,
): SetOnboardingWizardStepAction {
  return {
    type: SET_ONBOARDING_WIZARD_STEP,
    step,
  };
}
