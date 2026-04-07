import { REHYDRATE } from 'redux-persist';

interface WizardState {
  step: number;
}

const initialState: WizardState = {
  step: 0,
};

const onboardingWizardReducer = (state: WizardState = initialState, action: { type: string; step?: number }): WizardState => {
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
