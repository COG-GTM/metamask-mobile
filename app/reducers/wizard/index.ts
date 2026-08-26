/* eslint-disable @typescript-eslint/default-param-last */
import { REHYDRATE } from 'redux-persist';
import type { Action } from '../../actions/wizard';

export interface State {
  step: number;
}

export const initialState: State = {
  step: 0,
};

const onboardingWizardReducer = (
  state: State = initialState,
  action: Action | { type: typeof REHYDRATE },
): State => {
  switch (action.type) {
    case REHYDRATE:
      return {
        ...initialState,
      };
    case 'SET_ONBOARDING_WIZARD_STEP':
      return {
        ...state,
        step: action.step as number,
      };
    default:
      return state;
  }
};
export default onboardingWizardReducer;
