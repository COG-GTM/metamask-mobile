/* eslint-disable @typescript-eslint/default-param-last */

export type WizardState = number;

const initialState: WizardState = 0;

export interface WizardAction {
  type: 'SET_ONBOARDING_WIZARD_STEP';
  step: number;
}

const wizardReducer = (
  state: WizardState = initialState,
  action: WizardAction,
): WizardState => {
  switch (action.type) {
    case 'SET_ONBOARDING_WIZARD_STEP':
      return action.step;
    default:
      return state;
  }
};
export default wizardReducer;
