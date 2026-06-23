/* eslint-disable @typescript-eslint/default-param-last */
import { REHYDRATE } from 'redux-persist';
import {
  WizardAction,
  SET_ONBOARDING_WIZARD_STEP,
} from '../../actions/wizard';

export interface WizardState {
  step: number;
}

interface RehydrateAction {
  type: typeof REHYDRATE;
}

export const initialState: WizardState = {
  step: 0,
};

type ReducerAction = WizardAction | RehydrateAction;

const onboardingWizardReducer = (
  state: WizardState = initialState,
  action: ReducerAction,
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
