import { REHYDRATE } from 'redux-persist';

import { AnyAction } from 'redux';

export interface WizardState {
  step: number;
}

export type WizardAction =
  | { type: typeof REHYDRATE }
  | { type: 'SET_ONBOARDING_WIZARD_STEP'; step: number };

const initialState: WizardState = {
  step: 0,
};

const onboardingWizardReducer = (
  state: WizardState = initialState,
  action: AnyAction = { type: '' },
): WizardState => {
  switch (action.type) {
    case REHYDRATE:
      return {
        ...initialState,
      };
    case 'SET_ONBOARDING_WIZARD_STEP':
      return {
        ...state,
        step: action.step,
      };
    default:
      return state;
  }
};
export default onboardingWizardReducer;
