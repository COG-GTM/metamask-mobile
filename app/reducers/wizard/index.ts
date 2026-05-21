/* eslint-disable @typescript-eslint/default-param-last */
import { REHYDRATE } from 'redux-persist';

const SET_ONBOARDING_WIZARD_STEP = 'SET_ONBOARDING_WIZARD_STEP' as const;

interface RehydrateAction {
  type: typeof REHYDRATE;
}

interface SetOnboardingWizardStepAction {
  type: typeof SET_ONBOARDING_WIZARD_STEP;
  step: number;
}

type WizardAction = RehydrateAction | SetOnboardingWizardStepAction;

export interface WizardState {
  step: number;
}

const initialState: Readonly<WizardState> = {
  step: 0,
};

const onboardingWizardReducer = (
  state: WizardState = initialState,
  action: WizardAction,
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
