/* eslint-disable @typescript-eslint/default-param-last */
import { REHYDRATE } from 'redux-persist';
import { SET_ONBOARDING_WIZARD_STEP, WizardAction } from '../../actions/wizard';

export interface WizardState {
  step: number;
}

const initialState: Readonly<WizardState> = {
  step: 0,
};

const onboardingWizardReducer = (
  state: WizardState = initialState as WizardState,
  action: WizardAction | { type: typeof REHYDRATE },
): WizardState => {
  switch (action.type) {
    case REHYDRATE:
      return {
        ...initialState,
      };
    case SET_ONBOARDING_WIZARD_STEP:
      return {
        ...state,
        step: (action as WizardAction).step,
      };
    default:
      return state;
  }
};
export default onboardingWizardReducer;
