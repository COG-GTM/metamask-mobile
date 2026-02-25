import { WizardAction } from '../../reducers/wizard';

/**
 * Sets onboarding wizard step
 */
export default function setOnboardingWizardStep(step: number): WizardAction {
  return {
    type: 'SET_ONBOARDING_WIZARD_STEP',
    step,
  };
}
