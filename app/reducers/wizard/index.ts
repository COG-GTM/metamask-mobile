import { REHYDRATE } from 'redux-persist';
import { WizardAction } from '../../actions/wizard';

export interface WizardState {
  step: number;
}

interface RehydrateAction {
  type: typeof REHYDRATE;
}

type WizardReducerAction = WizardAction | RehydrateAction;

const initialState: WizardState = {
  step: 0,
};

const onboardingWizardReducer = (
  state: WizardState = initialState,
  action: WizardReducerAction,
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
