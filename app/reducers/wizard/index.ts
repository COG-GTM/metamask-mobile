import { REHYDRATE } from 'redux-persist';
import { Action } from 'redux';

export interface WizardState {
  step: number;
}

interface RehydrateAction extends Action<typeof REHYDRATE> {}

interface SetOnboardingWizardStepAction extends Action<'SET_ONBOARDING_WIZARD_STEP'> {
  step: number;
}

type WizardAction = RehydrateAction | SetOnboardingWizardStepAction | Action<string>;

const initialState: WizardState = {
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
    case 'SET_ONBOARDING_WIZARD_STEP':
      return {
        ...state,
        step: (action as SetOnboardingWizardStepAction).step,
      };
    default:
      return state;
  }
};
export default onboardingWizardReducer;
