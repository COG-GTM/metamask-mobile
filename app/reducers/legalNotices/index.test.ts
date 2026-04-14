import legalNoticesReducer, {
  storePrivacyPolicyShownDate,
  storePrivacyPolicyClickedOrClosed,
} from '.';

describe('LegalNotices Reducer', () => {
  const initialState = {
    newPrivacyPolicyToastClickedOrClosed: false,
    newPrivacyPolicyToastShownDate: null,
  };

  it('should return initial state', () => {
    expect(legalNoticesReducer(undefined, undefined)).toStrictEqual(initialState);
  });

  it('should handle STORE_PRIVACY_POLICY_SHOWN_DATE', () => {
    const action = storePrivacyPolicyShownDate(1234567890);
    const result = legalNoticesReducer(initialState, action as any);

    expect(result.newPrivacyPolicyToastShownDate).toBe(1234567890);
  });

  it('should not overwrite existing shown date', () => {
    const stateWithDate = {
      ...initialState,
      newPrivacyPolicyToastShownDate: 1111111111,
    };
    const action = storePrivacyPolicyShownDate(2222222222);
    const result = legalNoticesReducer(stateWithDate, action as any);

    expect(result.newPrivacyPolicyToastShownDate).toBe(1111111111);
  });

  it('should handle STORE_PRIVACY_POLICY_CLICKED_OR_CLOSED', () => {
    const action = storePrivacyPolicyClickedOrClosed();
    const result = legalNoticesReducer(initialState, action as any);

    expect(result.newPrivacyPolicyToastClickedOrClosed).toBe(true);
  });

  it('should return state for unknown action', () => {
    expect(legalNoticesReducer(initialState, { type: 'UNKNOWN' } as any)).toStrictEqual(initialState);
  });
});
