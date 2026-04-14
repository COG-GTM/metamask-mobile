import onboardingWizardReducer from '.';

describe('Wizard Reducer', () => {
  const initialState = { step: 0 };

  it('should return initial state', () => {
    expect(onboardingWizardReducer(undefined, {})).toStrictEqual(initialState);
  });

  it('should handle SET_ONBOARDING_WIZARD_STEP', () => {
    const result = onboardingWizardReducer(initialState, {
      type: 'SET_ONBOARDING_WIZARD_STEP',
      step: 3,
    });

    expect(result.step).toBe(3);
  });

  it('should handle REHYDRATE by resetting to initial state', () => {
    const modifiedState = { step: 5 };
    const result = onboardingWizardReducer(modifiedState, { type: 'persist/REHYDRATE' });

    expect(result).toStrictEqual(initialState);
  });

  it('should return state for unknown action', () => {
    expect(onboardingWizardReducer(initialState, { type: 'UNKNOWN' })).toStrictEqual(initialState);
  });
});
