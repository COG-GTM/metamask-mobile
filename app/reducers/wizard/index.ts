import { REHYDRATE } from 'redux-persist';

/**
 * State shape for the wizard reducer
 */
export interface WizardState {
  step: number;
}

/**
 * Action types for wizard reducer
 */
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
        step: action.step,
      };
    default:
      return state;
  }
};

export default onboardingWizardReducer;
