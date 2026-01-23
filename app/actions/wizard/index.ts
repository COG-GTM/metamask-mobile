export const WizardActionTypes = {
  SET_ONBOARDING_WIZARD_STEP: 'SET_ONBOARDING_WIZARD_STEP',
} as const;

export interface SetOnboardingWizardStepAction {
  type: typeof WizardActionTypes.SET_ONBOARDING_WIZARD_STEP;
  step: number;
}

export type WizardAction = SetOnboardingWizardStepAction;

export default function setOnboardingWizardStep(
  step: number,
): SetOnboardingWizardStepAction {
  return {
    type: WizardActionTypes.SET_ONBOARDING_WIZARD_STEP,
    step,
  };
}
