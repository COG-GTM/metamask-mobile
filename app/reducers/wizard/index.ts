import { REHYDRATE } from 'redux-persist';

interface WizardState {
  step: number;
}

interface WizardAction {
  type: string;
  step?: number;
}

const initialState: WizardState = {
  step: 0,
};

const onboardingWizardReducer = (
  state = initialState,
  action: WizardAction,
): WizardState => {
  switch (action.type) {
    case REHYDRATE:
      return {
        ...initialState,
      };
    case 'SET_ONBOARDING_WIZARD_STEP':
      return {
        ...state,
        step: action.step!,
      };
    default:
      return state;
  }
};
export default onboardingWizardReducer;
