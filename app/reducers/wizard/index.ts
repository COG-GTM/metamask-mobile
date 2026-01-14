/* eslint-disable @typescript-eslint/default-param-last */
import { REHYDRATE } from 'redux-persist';
import { WizardAction, WizardActionType } from '../../actions/wizard';

export interface WizardState {
  step: number;
}

export const wizardInitialState: WizardState = {
  step: 0,
};

interface RehydrateAction {
  type: typeof REHYDRATE;
}

type WizardReducerAction = WizardAction | RehydrateAction;

const onboardingWizardReducer = (
  state: WizardState = wizardInitialState,
  action: WizardReducerAction,
): WizardState => {
  switch (action.type) {
    case REHYDRATE:
      return {
        ...wizardInitialState,
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
