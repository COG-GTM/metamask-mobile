/* eslint-disable @typescript-eslint/default-param-last */
import { REHYDRATE } from 'redux-persist';

export interface WizardState {
  step: number;
}

const initialState: WizardState = {
  step: 0,
};

export type WizardAction =
  | { type: 'SET_ONBOARDING_WIZARD_STEP'; step: number }
  | { type: typeof REHYDRATE };

const wizardReducer = (
  state: WizardState = initialState,
  action: WizardAction,
): WizardState => {
  switch (action.type) {
    case REHYDRATE:
      return { ...initialState };
    case 'SET_ONBOARDING_WIZARD_STEP':
      return { ...state, step: action.step };
    default:
      return state;
  }
};

export default wizardReducer;
