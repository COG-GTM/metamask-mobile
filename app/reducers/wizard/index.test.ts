import wizardReducer from './index';

describe('wizardReducer', () => {
  it('returns initial state', () => {
    const state = wizardReducer(undefined, { type: 'UNKNOWN' } as never);
    expect(state).toBe(0);
  });

  it('sets the onboarding wizard step', () => {
    const state = wizardReducer(undefined, {
      type: 'SET_ONBOARDING_WIZARD_STEP',
      step: 3,
    });
    expect(state).toBe(3);
  });
});
