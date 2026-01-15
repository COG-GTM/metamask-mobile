import { REHYDRATE } from 'redux-persist';
import { Reducer } from 'redux';

/**
 * State shape for the wizard reducer
 */
export interface WizardState {
  step: number;
}

/**
 * Action types for wizard
 */
export const ACTIONS = {
  SET_ONBOARDING_WIZARD_STEP: 'SET_ONBOARDING_WIZARD_STEP',
} as const;

interface SetOnboardingWizardStepAction {
  type: typeof ACTIONS.SET_ONBOARDING_WIZARD_STEP;
  step: number;
}

interface RehydrateAction {
  type: typeof REHYDRATE;
}

type WizardAction = SetOnboardingWizardStepAction | RehydrateAction;

export const initialState: WizardState = {
  step: 0,
};

const onboardingWizardReducer: Reducer<
  WizardState,
  WizardAction | { type: string }
> = (state = initialState, action): WizardState => {
  switch (action.type) {
    case REHYDRATE:
      return {
        ...initialState,
      };
    case ACTIONS.SET_ONBOARDING_WIZARD_STEP:
      return {
        ...state,
        step: (action as SetOnboardingWizardStepAction).step,
      };
    default:
      return state;
  }
};

export default onboardingWizardReducer;
