/* eslint-disable @typescript-eslint/default-param-last */
import { REHYDRATE, type RehydrateAction } from 'redux-persist';
import {
  SET_ONBOARDING_WIZARD_STEP,
  type WizardAction,
} from '../../actions/wizard';

export interface WizardState {
  step: number;
}

const initialState: WizardState = {
  step: 0,
};

const onboardingWizardReducer = (
  state: WizardState = initialState,
  action: WizardAction | RehydrateAction,
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
