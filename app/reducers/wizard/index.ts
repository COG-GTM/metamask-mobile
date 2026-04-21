/* eslint-disable @typescript-eslint/default-param-last */
import { REHYDRATE } from 'redux-persist';
import type { WizardAction } from '../../actions/wizard';
import { SET_ONBOARDING_WIZARD_STEP } from '../../actions/wizard';

export interface WizardState {
  step: number;
}

const initialState: WizardState = {
  step: 0,
};

interface RehydrateAction {
  type: typeof REHYDRATE;
}

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
