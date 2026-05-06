import type { Action as ReduxAction } from 'redux';

export enum ActionType {
  SET_ONBOARDING_WIZARD_STEP = 'SET_ONBOARDING_WIZARD_STEP',
}

export interface SetOnboardingWizardStepAction
  extends ReduxAction<ActionType.SET_ONBOARDING_WIZARD_STEP> {
  step: number;
}

export type Action = SetOnboardingWizardStepAction;

/**
 * Sets onboarding wizard step
 */
export default function setOnboardingWizardStep(
  step: number,
): SetOnboardingWizardStepAction {
  return {
    type: ActionType.SET_ONBOARDING_WIZARD_STEP,
    step,
  };
}
