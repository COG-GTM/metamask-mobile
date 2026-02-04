import { REHYDRATE } from 'redux-persist';

export interface WizardState {
  step: number;
}

const initialState: WizardState = {
  step: 0,
};

interface WizardAction {
  type: string;
  step?: number;
}

const onboardingWizardReducer = (
  state: WizardState = initialState,
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
        step: action.step ?? state.step,
      };
    default:
      return state;
  }
};
export default onboardingWizardReducer;
