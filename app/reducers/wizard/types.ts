import { Action } from 'redux';

/**
 * Wizard action type enum
 */
export enum WizardActionType {
  SET_ONBOARDING_WIZARD_STEP = 'SET_ONBOARDING_WIZARD_STEP',
}

/**
 * Wizard state interface
 */
export interface WizardState {
  step: number;
}

/**
 * Set onboarding wizard step action
 */
export interface SetOnboardingWizardStepAction
  extends Action<WizardActionType.SET_ONBOARDING_WIZARD_STEP> {
  step: number;
}

/**
 * Wizard actions union type
 */
export type WizardAction = SetOnboardingWizardStepAction;
