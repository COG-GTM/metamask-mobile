/* eslint-disable @typescript-eslint/default-param-last */
import { Action } from 'redux';
import {
  SET_ONBOARDING_WIZARD_STEP,
  WizardActionTypes,
} from '../../actions/wizard';

export interface WizardState {
  step: number;
}

const initialState: WizardState = {
  step: 0,
};

interface RehydrateAction extends Action<'persist/REHYDRATE'> {
  payload?: {
    wizard?: WizardState;
  };
}

type WizardReducerAction = WizardActionTypes | RehydrateAction;

const onboardingWizardReducer = (
  state: WizardState = initialState,
  action: WizardReducerAction,
): WizardState => {
  switch (action.type) {
    case 'persist/REHYDRATE':
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
