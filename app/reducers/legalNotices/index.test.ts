import legalNoticesReducer, {
  storePrivacyPolicyShownDate,
  storePrivacyPolicyClickedOrClosed,
  isPastPrivacyPolicyDate,
} from './';

describe('legalNoticesReducer', () => {
  const initialState = {
    newPrivacyPolicyToastClickedOrClosed: false,
    newPrivacyPolicyToastShownDate: null,
  };

  it('should return the initial state', () => {
    expect(legalNoticesReducer(undefined, undefined)).toEqual(initialState);
  });

  describe('STORE_PRIVACY_POLICY_SHOWN_DATE', () => {
    it('should store the shown date when not previously set', () => {
      const timestamp = Date.now();
      const action = storePrivacyPolicyShownDate(timestamp);
      const result = legalNoticesReducer(initialState, action);
      expect(result.newPrivacyPolicyToastShownDate).toBe(timestamp);
    });

    it('should not overwrite an already set shown date', () => {
      const firstTimestamp = 1000000;
      const stateWithDate = {
        ...initialState,
        newPrivacyPolicyToastShownDate: firstTimestamp,
      };
      const secondTimestamp = 2000000;
      const action = storePrivacyPolicyShownDate(secondTimestamp);
      const result = legalNoticesReducer(stateWithDate, action);
      expect(result.newPrivacyPolicyToastShownDate).toBe(firstTimestamp);
    });
  });

  describe('STORE_PRIVACY_POLICY_CLICKED_OR_CLOSED', () => {
    it('should set clicked or closed to true', () => {
      const action = storePrivacyPolicyClickedOrClosed();
      const result = legalNoticesReducer(initialState, action);
      expect(result.newPrivacyPolicyToastClickedOrClosed).toBe(true);
    });
  });

  it('should return state unchanged for unknown action', () => {
    const state = { ...initialState };
    const result = legalNoticesReducer(state, {
      type: 'UNKNOWN',
      newPrivacyPolicyToastShownDate: false,
      payload: 0,
    });
    expect(result).toBe(state);
  });
});

describe('action creators', () => {
  it('storePrivacyPolicyShownDate should create correct action', () => {
    const timestamp = 1234567890;
    const action = storePrivacyPolicyShownDate(timestamp);
    expect(action).toEqual({
      type: 'STORE_PRIVACY_POLICY_SHOWN_DATE',
      payload: 1234567890,
    });
  });

  it('storePrivacyPolicyClickedOrClosed should create correct action', () => {
    const action = storePrivacyPolicyClickedOrClosed();
    expect(action).toEqual({
      type: 'STORE_PRIVACY_POLICY_CLICKED_OR_CLOSED',
    });
  });
});

describe('isPastPrivacyPolicyDate', () => {
  it('should be a boolean', () => {
    expect(typeof isPastPrivacyPolicyDate).toBe('boolean');
  });
});
