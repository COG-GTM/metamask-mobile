import onboardingWizardReducer, { WizardState } from './index';
import type { WizardAction } from '../../actions/wizard';

const emptyAction = { type: null } as unknown as WizardAction;

describe('onboardingWizardReducer', () => {
  it('should return initial state', () => {
    const initialState: WizardState = {
      step: 0,
    };
    expect(onboardingWizardReducer(undefined, emptyAction)).toEqual(
      initialState,
    );
  });
});
