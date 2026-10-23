import { createSlice, type AnyAction } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';
import {
  ActionType,
  type SetOnboardingWizardStepAction,
} from '../../actions/wizard';

export interface WizardState {
  step: number;
}

export const initialState: WizardState = {
  step: 0,
};

const slice = createSlice({
  name: 'wizard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(
        ActionType.SET_ONBOARDING_WIZARD_STEP,
        (state, action: SetOnboardingWizardStepAction): WizardState => ({
          ...state,
          step: action.step,
        }),
      )
      // Matcher (not addCase) so REHYDRATE is compared at dispatch time exactly
      // like the legacy `case REHYDRATE`, including when redux-persist is mocked.
      .addMatcher(
        (action: AnyAction) => action.type === REHYDRATE,
        (): WizardState => ({
          ...initialState,
        }),
      );
  },
});

const onboardingWizardReducer = slice.reducer;

export default onboardingWizardReducer;
