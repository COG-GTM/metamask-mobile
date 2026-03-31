import { type Action } from 'redux';

/**
 * Wizard action type enum
 */
export enum WizardActionType {
  SET_ONBOARDING_WIZARD_STEP = 'SET_ONBOARDING_WIZARD_STEP',
}

export interface SetOnboardingWizardStepAction
  extends Action<WizardActionType.SET_ONBOARDING_WIZARD_STEP> {
  step: number;
}

/**
 * Union type for wizard actions
 */
export type WizardAction = SetOnboardingWizardStepAction;

/**
 * Sets onboarding wizard step
 */
export default function setOnboardingWizardStep(
  step: number,
): SetOnboardingWizardStepAction {
  return {
    type: WizardActionType.SET_ONBOARDING_WIZARD_STEP,
    step,
  };
}
