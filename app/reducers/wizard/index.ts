import { REHYDRATE } from 'redux-persist';

interface WizardState {
  step: number;
}

interface RehydrateAction {
  type: typeof REHYDRATE;
}

interface SetOnboardingWizardStepAction {
  type: 'SET_ONBOARDING_WIZARD_STEP';
  step: number;
}

type WizardAction = RehydrateAction | SetOnboardingWizardStepAction;

const initialState: WizardState = {
  step: 0,
};

/* eslint-disable @typescript-eslint/default-param-last */
const onboardingWizardReducer = (state: WizardState = initialState, action: WizardAction): WizardState => {
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
