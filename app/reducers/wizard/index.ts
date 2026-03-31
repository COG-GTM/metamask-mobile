/* eslint-disable @typescript-eslint/default-param-last */
import { REHYDRATE } from 'redux-persist';
import {
  type WizardAction,
  WizardActionType,
} from '../../actions/wizard';

/**
 * Wizard state interface
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type WizardState = {
  step: number;
};

const initialState: WizardState = {
  step: 0,
};

const onboardingWizardReducer = (
  state: WizardState = initialState,
  action: WizardAction | { type: typeof REHYDRATE },
): WizardState => {
  switch (action.type) {
    case REHYDRATE:
      return {
        ...initialState,
      };
    case WizardActionType.SET_ONBOARDING_WIZARD_STEP:
      return {
        ...state,
        step: action.step,
      };
    default:
      return state;
  }
};
export default onboardingWizardReducer;
