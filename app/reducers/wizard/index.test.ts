import { REHYDRATE } from 'redux-persist';
import wizardReducer from './index';

describe('wizardReducer', () => {
  it('returns initial state', () => {
    const state = wizardReducer(undefined, { type: 'UNKNOWN' } as never);
    expect(state).toEqual({ step: 0 });
  });

  it('sets the onboarding wizard step', () => {
    const state = wizardReducer(undefined, {
      type: 'SET_ONBOARDING_WIZARD_STEP',
      step: 3,
    });
    expect(state).toEqual({ step: 3 });
  });

  it('resets to initial state on REHYDRATE', () => {
    const state = wizardReducer(
      { step: 5 },
      { type: REHYDRATE } as never,
    );
    expect(state).toEqual({ step: 0 });
  });
});
