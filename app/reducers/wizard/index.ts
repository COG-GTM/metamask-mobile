import { REHYDRATE } from 'redux-persist';
import { WizardState, WizardAction, WizardActionType } from './types';

export * from './types';

/**
 * Initial wizard state
 */
export const wizardInitialState: WizardState = {
  step: 0,
};

/**
 * Rehydrate action type from redux-persist
 */
interface RehydrateAction {
  type: typeof REHYDRATE;
}

/**
 * Combined action type for the wizard reducer
 */
type WizardReducerAction = WizardAction | RehydrateAction;

/**
 * Wizard reducer
 */
/* eslint-disable @typescript-eslint/default-param-last */
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
