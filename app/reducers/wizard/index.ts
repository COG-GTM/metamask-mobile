/* eslint-disable @typescript-eslint/default-param-last */
import { REHYDRATE } from 'redux-persist';

// TODO: import from actions when migrated
type WizardAction =
  | { type: 'SET_ONBOARDING_WIZARD_STEP'; step: number };

export interface WizardState {
  step: number;
}

const initialState: WizardState = {
  step: 0,
};

const onboardingWizardReducer = (
  state: WizardState = initialState,
  action: WizardAction | { type: string },
): WizardState => {
  if (action.type === REHYDRATE) {
    return { ...initialState };
  }
  const typedAction = action as WizardAction;
  switch (typedAction.type) {
    case 'SET_ONBOARDING_WIZARD_STEP':
      return {
        ...state,
        step: typedAction.step,
      };
    default:
      return state;
  }
};
export default onboardingWizardReducer;
