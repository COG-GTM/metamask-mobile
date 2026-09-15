/**
 * Sets onboarding wizard step
 */
import { REHYDRATE } from 'redux-persist';

export interface SetOnboardingWizardStepAction {
  type: 'SET_ONBOARDING_WIZARD_STEP';
  step: number;
}

export interface RehydrateWizardAction {
  type: typeof REHYDRATE;
}

export type WizardAction = SetOnboardingWizardStepAction | RehydrateWizardAction;

export default function setOnboardingWizardStep(
  step: number,
): SetOnboardingWizardStepAction {
  return {
    type: 'SET_ONBOARDING_WIZARD_STEP',
    step,
  };
}
