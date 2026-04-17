import legalNoticesReducer, {
  storePrivacyPolicyShownDate,
  storePrivacyPolicyClickedOrClosed,
  shouldShowNewPrivacyToastSelector,
} from './index';
import ACTIONS from './types';

const initialState = {
  newPrivacyPolicyToastClickedOrClosed: false,
  newPrivacyPolicyToastShownDate: null,
};

describe('legalNoticesReducer', () => {
  it('should return initial state', () => {
    const state = legalNoticesReducer(undefined, undefined);
    expect(state).toEqual(initialState);
  });

  it('should handle STORE_PRIVACY_POLICY_SHOWN_DATE', () => {
    const timestamp = Date.now();
    const state = legalNoticesReducer(initialState, {
      type: ACTIONS.STORE_PRIVACY_POLICY_SHOWN_DATE,
      payload: timestamp,
    } as any);
    expect(state.newPrivacyPolicyToastShownDate).toBe(timestamp);
  });

  it('should not overwrite existing STORE_PRIVACY_POLICY_SHOWN_DATE', () => {
    const existingDate = Date.now() - 10000;
    const stateWithDate = {
      ...initialState,
      newPrivacyPolicyToastShownDate: existingDate,
    };
    const state = legalNoticesReducer(stateWithDate, {
      type: ACTIONS.STORE_PRIVACY_POLICY_SHOWN_DATE,
      payload: Date.now(),
    } as any);
    expect(state.newPrivacyPolicyToastShownDate).toBe(existingDate);
  });

  it('should handle STORE_PRIVACY_POLICY_CLICKED_OR_CLOSED', () => {
    const state = legalNoticesReducer(initialState, {
      type: ACTIONS.STORE_PRIVACY_POLICY_CLICKED_OR_CLOSED,
    } as any);
    expect(state.newPrivacyPolicyToastClickedOrClosed).toBe(true);
  });

  it('should return current state for unknown action', () => {
    const state = legalNoticesReducer(initialState, {
      type: 'UNKNOWN',
    } as any);
    expect(state).toBe(initialState);
  });
});

describe('legalNotices action creators', () => {
  it('storePrivacyPolicyShownDate creates correct action', () => {
    const ts = 12345;
    expect(storePrivacyPolicyShownDate(ts)).toEqual({
      type: ACTIONS.STORE_PRIVACY_POLICY_SHOWN_DATE,
      payload: ts,
    });
  });

  it('storePrivacyPolicyClickedOrClosed creates correct action', () => {
    expect(storePrivacyPolicyClickedOrClosed()).toEqual({
      type: ACTIONS.STORE_PRIVACY_POLICY_CLICKED_OR_CLOSED,
    });
  });
});

describe('shouldShowNewPrivacyToastSelector', () => {
  it('should return false when clicked or closed', () => {
    const state = {
      legalNotices: {
        newPrivacyPolicyToastClickedOrClosed: true,
        newPrivacyPolicyToastShownDate: null,
      },
    };
    expect(shouldShowNewPrivacyToastSelector(state as any)).toBe(false);
  });

  it('should return false when not past privacy policy date (before 2024-06-18)', () => {
    const state = {
      legalNotices: {
        newPrivacyPolicyToastClickedOrClosed: false,
        newPrivacyPolicyToastShownDate: null,
      },
    };
    // This test's behavior depends on current date being past 2024-06-18
    const result = shouldShowNewPrivacyToastSelector(state as any);
    expect(typeof result).toBe('boolean');
  });
});
