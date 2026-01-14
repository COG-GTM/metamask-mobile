import type { Action as ReduxAction } from 'redux';

export enum WizardActionType {
  SET_ONBOARDING_WIZARD_STEP = 'SET_ONBOARDING_WIZARD_STEP',
}

export interface SetOnboardingWizardStepAction
  extends ReduxAction<WizardActionType.SET_ONBOARDING_WIZARD_STEP> {
  step: number;
}

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
