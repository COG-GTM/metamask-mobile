/* eslint-disable @typescript-eslint/default-param-last */
import { REHYDRATE } from 'redux-persist';

export type WizardAction =
  | { type: typeof REHYDRATE }
  | { type: 'SET_ONBOARDING_WIZARD_STEP'; step: number };

const initialState = {
  step: 0,
};

const onboardingWizardReducer = (
  state = initialState,
  action: WizardAction,
) => {
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
