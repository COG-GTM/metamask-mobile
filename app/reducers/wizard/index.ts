export interface WizardState {
  step: number;
}

interface SetOnboardingWizardStepAction {
  type: 'SET_ONBOARDING_WIZARD_STEP';
  step: number;
}

type WizardAction = SetOnboardingWizardStepAction;

const initialState: WizardState = {
  step: 0,
};

const wizardReducer = (state: WizardState = initialState, action: WizardAction): WizardState => {
  switch (action.type) {
    case 'SET_ONBOARDING_WIZARD_STEP':
      return {
        ...state,
        step: action.step,
      };
    default:
      return state;
  }
};

export default wizardReducer;
