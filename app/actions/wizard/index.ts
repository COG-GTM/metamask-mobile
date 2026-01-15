import {
  WizardActionType,
  SetOnboardingWizardStepAction,
} from '../../reducers/wizard/types';

/**
 * Sets onboarding wizard step
 * @param step - The step number to set
 * @returns The action object
 */
export default function setOnboardingWizardStep(
  step: number,
): SetOnboardingWizardStepAction {
  return {
    type: WizardActionType.SET_ONBOARDING_WIZARD_STEP,
    step,
  };
}
