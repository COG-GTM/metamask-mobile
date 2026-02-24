import { REHYDRATE } from 'redux-persist';

const initialState = {
  step: 0,
};

interface WizardAction {
  type: string;
  step?: number;
}

const onboardingWizardReducer = (state = initialState, action: WizardAction) => {
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
