import reducer, { initialState } from './index';
import setOnboardingWizardStep, {
  type SetOnboardingWizardStepAction,
} from '../../actions/wizard';

describe('onboardingWizardReducer', () => {
  it('returns initial state for an unknown action', () => {
    expect(
      reducer(
        undefined,
        { type: 'UNKNOWN' } as unknown as SetOnboardingWizardStepAction,
      ),
    ).toEqual(initialState);
  });

  it('sets the onboarding step', () => {
    expect(reducer(undefined, setOnboardingWizardStep(2))).toEqual({ step: 2 });
  });
});
