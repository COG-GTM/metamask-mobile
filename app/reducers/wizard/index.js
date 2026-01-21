import { REHYDRATE } from 'redux-persist';

/** @type {import('./types').WizardState} */
export const initialState = {
  step: 0,
};

const onboardingWizardReducer = (state = initialState, action) => {
  switch (action.type) {
    case REHYDRATE:
      return {
        ...initialState,
      };
    case 'SET_ONBOARDING_WIZARD_STEP':
      return {
        ...state,
        step: action.step,
      };
    default:
      return state;
  }
};
export default onboardingWizardReducer;
