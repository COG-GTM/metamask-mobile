import { REHYDRATE } from 'redux-persist';
import { SET_ONBOARDING_WIZARD_STEP, WizardAction } from '../../actions/wizard';

export interface WizardState {
  step: number;
}

const initialState: WizardState = {
  step: 0,
};

type WizardReducerAction = WizardAction | { type: typeof REHYDRATE };

const onboardingWizardReducer = (
  state: WizardState = initialState,
  action: WizardReducerAction,
): WizardState => {
  switch (action.type) {
    case REHYDRATE:
      return {
        ...initialState,
      };
    case SET_ONBOARDING_WIZARD_STEP:
      return {
        ...state,
        step: action.step,
      };
    default:
      return state;
  }
};
export default onboardingWizardReducer;
