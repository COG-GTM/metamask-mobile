import userReducer, { userInitialState } from './index';
import { UserActionType } from '../../actions/user/types';
import { AppThemeKey } from '../../util/theme/models';

describe('userReducer', () => {
  it('should return initial state', () => {
    const state = userReducer(undefined, { type: 'UNKNOWN' } as any);
    expect(state).toEqual(userInitialState);
  });

  it('should handle LOGIN', () => {
    const state = userReducer(userInitialState, { type: UserActionType.LOGIN });
    expect(state.userLoggedIn).toBe(true);
  });

  it('should handle LOGOUT', () => {
    const loggedInState = { ...userInitialState, userLoggedIn: true };
    const state = userReducer(loggedInState, { type: UserActionType.LOGOUT });
    expect(state.userLoggedIn).toBe(false);
  });

  it('should handle LOADING_SET', () => {
    const state = userReducer(userInitialState, {
      type: UserActionType.LOADING_SET,
      loadingMsg: 'Loading...',
    } as any);
    expect(state.loadingSet).toBe(true);
    expect(state.loadingMsg).toBe('Loading...');
  });

  it('should handle LOADING_UNSET', () => {
    const loadingState = { ...userInitialState, loadingSet: true, loadingMsg: 'Test' };
    const state = userReducer(loadingState, { type: UserActionType.LOADING_UNSET });
    expect(state.loadingSet).toBe(false);
  });

  it('should handle PASSWORD_SET', () => {
    const state = userReducer(userInitialState, { type: UserActionType.PASSWORD_SET });
    expect(state.passwordSet).toBe(true);
  });

  it('should handle PASSWORD_UNSET', () => {
    const state = userReducer(
      { ...userInitialState, passwordSet: true },
      { type: UserActionType.PASSWORD_UNSET },
    );
    expect(state.passwordSet).toBe(false);
  });

  it('should handle SEEDPHRASE_NOT_BACKED_UP', () => {
    const state = userReducer(userInitialState, {
      type: UserActionType.SEEDPHRASE_NOT_BACKED_UP,
    });
    expect(state.seedphraseBackedUp).toBe(false);
    expect(state.backUpSeedphraseVisible).toBe(true);
  });

  it('should handle SEEDPHRASE_BACKED_UP', () => {
    const state = userReducer(userInitialState, {
      type: UserActionType.SEEDPHRASE_BACKED_UP,
    });
    expect(state.seedphraseBackedUp).toBe(true);
    expect(state.backUpSeedphraseVisible).toBe(false);
  });

  it('should handle BACK_UP_SEEDPHRASE_VISIBLE', () => {
    const state = userReducer(userInitialState, {
      type: UserActionType.BACK_UP_SEEDPHRASE_VISIBLE,
    });
    expect(state.backUpSeedphraseVisible).toBe(true);
  });

  it('should handle BACK_UP_SEEDPHRASE_NOT_VISIBLE', () => {
    const state = userReducer(
      { ...userInitialState, backUpSeedphraseVisible: true },
      { type: UserActionType.BACK_UP_SEEDPHRASE_NOT_VISIBLE },
    );
    expect(state.backUpSeedphraseVisible).toBe(false);
  });

  it('should handle PROTECT_MODAL_VISIBLE when seedphrase not backed up', () => {
    const state = userReducer(
      { ...userInitialState, seedphraseBackedUp: false },
      { type: UserActionType.PROTECT_MODAL_VISIBLE },
    );
    expect(state.protectWalletModalVisible).toBe(true);
  });

  it('should not show PROTECT_MODAL when seedphrase is backed up', () => {
    const state = userReducer(
      { ...userInitialState, seedphraseBackedUp: true },
      { type: UserActionType.PROTECT_MODAL_VISIBLE },
    );
    expect(state.protectWalletModalVisible).toBeFalsy();
  });

  it('should handle PROTECT_MODAL_NOT_VISIBLE', () => {
    const state = userReducer(
      { ...userInitialState, protectWalletModalVisible: true },
      { type: UserActionType.PROTECT_MODAL_NOT_VISIBLE },
    );
    expect(state.protectWalletModalVisible).toBe(false);
  });

  it('should handle SET_GAS_EDUCATION_CAROUSEL_SEEN', () => {
    const state = userReducer(userInitialState, {
      type: UserActionType.SET_GAS_EDUCATION_CAROUSEL_SEEN,
    });
    expect(state.gasEducationCarouselSeen).toBe(true);
  });

  it('should handle SET_APP_THEME', () => {
    const state = userReducer(userInitialState, {
      type: UserActionType.SET_APP_THEME,
      payload: { theme: AppThemeKey.dark },
    } as any);
    expect(state.appTheme).toBe(AppThemeKey.dark);
  });

  it('should handle SET_APP_SERVICES_READY', () => {
    const state = userReducer(userInitialState, {
      type: UserActionType.SET_APP_SERVICES_READY,
    });
    expect(state.appServicesReady).toBe(true);
  });

  it('should return current state for unknown action', () => {
    const state = userReducer(userInitialState, { type: 'UNKNOWN' } as any);
    expect(state).toBe(userInitialState);
  });
});
