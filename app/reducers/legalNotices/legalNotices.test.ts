import legalNoticesReducer, {
  storePrivacyPolicyShownDate,
  storePrivacyPolicyClickedOrClosed,
  shouldShowNewPrivacyToastSelector,
  isPastPrivacyPolicyDate,
} from './index';
import ACTIONS from './types';
import { RootState } from '..';

interface LegalNoticesState {
  newPrivacyPolicyToastClickedOrClosed: boolean;
  newPrivacyPolicyToastShownDate: number | null;
}

const buildState = (legalNotices: LegalNoticesState) =>
  ({ legalNotices } as unknown as RootState);

const reduce = (
  state: LegalNoticesState | undefined,
  action: Parameters<typeof legalNoticesReducer>[1],
): LegalNoticesState =>
  legalNoticesReducer(
    state as Parameters<typeof legalNoticesReducer>[0],
    action,
  ) as LegalNoticesState;

describe('legalNoticesReducer', () => {
  const initialState = reduce(undefined, undefined);

  it('returns the initial state', () => {
    expect(initialState).toEqual({
      newPrivacyPolicyToastClickedOrClosed: false,
      newPrivacyPolicyToastShownDate: null,
    });
  });

  it('stores the shown date only once', () => {
    let state = reduce(
      initialState,
      storePrivacyPolicyShownDate(100) as never,
    );
    expect(state.newPrivacyPolicyToastShownDate).toBe(100);

    state = reduce(
      state,
      storePrivacyPolicyShownDate(200) as never,
    );
    expect(state.newPrivacyPolicyToastShownDate).toBe(100);
  });

  it('marks the toast as clicked or closed', () => {
    const state = reduce(
      initialState,
      storePrivacyPolicyClickedOrClosed() as never,
    );
    expect(state.newPrivacyPolicyToastClickedOrClosed).toBe(true);
  });

  it('creates actions', () => {
    expect(storePrivacyPolicyShownDate(5)).toEqual({
      type: ACTIONS.STORE_PRIVACY_POLICY_SHOWN_DATE,
      payload: 5,
    });
    expect(storePrivacyPolicyClickedOrClosed()).toEqual({
      type: ACTIONS.STORE_PRIVACY_POLICY_CLICKED_OR_CLOSED,
    });
  });
});

describe('shouldShowNewPrivacyToastSelector', () => {
  // The global test setup pins Date.now() to 123 (epoch), which is before the
  // new privacy policy date, so the selector must never show the toast.
  it('is not past the privacy policy date under the mocked clock', () => {
    expect(isPastPrivacyPolicyDate).toBe(false);
  });

  it('returns false when the toast was clicked or closed', () => {
    expect(
      shouldShowNewPrivacyToastSelector(
        buildState({
          newPrivacyPolicyToastClickedOrClosed: true,
          newPrivacyPolicyToastShownDate: null,
        }),
      ),
    ).toBe(false);
  });

  it('returns false when the toast has never been shown but the policy date is in the future', () => {
    expect(
      shouldShowNewPrivacyToastSelector(
        buildState({
          newPrivacyPolicyToastClickedOrClosed: false,
          newPrivacyPolicyToastShownDate: null,
        }),
      ),
    ).toBe(false);
  });

  it('returns false when the toast was shown recently but the policy date is in the future', () => {
    expect(
      shouldShowNewPrivacyToastSelector(
        buildState({
          newPrivacyPolicyToastClickedOrClosed: false,
          newPrivacyPolicyToastShownDate: Date.now() - 1000,
        }),
      ),
    ).toBe(false);
  });

  it('returns false when the toast was shown more than a day ago', () => {
    expect(
      shouldShowNewPrivacyToastSelector(
        buildState({
          newPrivacyPolicyToastClickedOrClosed: false,
          newPrivacyPolicyToastShownDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
        }),
      ),
    ).toBe(false);
  });
});

describe('shouldShowNewPrivacyToastSelector after the privacy policy date', () => {
  const now = new Date('2024-07-01T12:00:00Z').getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  let legalNotices: typeof import('./index');

  beforeAll(() => {
    jest.spyOn(Date, 'now').mockReturnValue(now);
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      legalNotices = require('./index');
    });
  });

  afterAll(() => {
    jest.spyOn(Date, 'now').mockReturnValue(123);
  });

  it('is past the privacy policy date', () => {
    expect(legalNotices.isPastPrivacyPolicyDate).toBe(true);
  });

  it('shows the toast when it has never been shown', () => {
    expect(
      legalNotices.shouldShowNewPrivacyToastSelector(
        buildState({
          newPrivacyPolicyToastClickedOrClosed: false,
          newPrivacyPolicyToastShownDate: null,
        }),
      ),
    ).toBe(true);
  });

  it('keeps showing the toast within a day of first being shown', () => {
    expect(
      legalNotices.shouldShowNewPrivacyToastSelector(
        buildState({
          newPrivacyPolicyToastClickedOrClosed: false,
          newPrivacyPolicyToastShownDate: now - 1000,
        }),
      ),
    ).toBe(true);
  });

  it('stops showing the toast more than a day after it was shown', () => {
    expect(
      legalNotices.shouldShowNewPrivacyToastSelector(
        buildState({
          newPrivacyPolicyToastClickedOrClosed: false,
          newPrivacyPolicyToastShownDate: now - 2 * oneDay,
        }),
      ),
    ).toBe(false);
  });

  it('does not show the toast once clicked or closed', () => {
    expect(
      legalNotices.shouldShowNewPrivacyToastSelector(
        buildState({
          newPrivacyPolicyToastClickedOrClosed: true,
          newPrivacyPolicyToastShownDate: null,
        }),
      ),
    ).toBe(false);
  });
});
