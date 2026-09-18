import userReducer, { userInitialState } from './index';
import {
  interruptBiometrics,
  lockApp,
  authSuccess,
  authError,
  passwordSet,
  passwordUnset,
  seedphraseBackedUp,
  seedphraseNotBackedUp,
  backUpSeedphraseAlertVisible,
  backUpSeedphraseAlertNotVisible,
  protectWalletModalVisible,
  protectWalletModalNotVisible,
  loadingSet,
  loadingUnset,
  setGasEducationCarouselSeen,
  logIn,
  logOut,
  setAppTheme,
  checkedAuth,
  onPersistedDataLoaded,
  setAppServicesReady,
  UserActionType,
} from '../../actions/user';
import { AppThemeKey } from '../../util/theme/models';

describe('userReducer', () => {
  it('returns the initial state', () => {
    expect(userReducer(undefined, interruptBiometrics())).toEqual(
      userInitialState,
    );
  });

  it('logs in and out', () => {
    let state = userReducer(userInitialState, logIn());
    expect(state.userLoggedIn).toBe(true);
    state = userReducer(state, logOut());
    expect(state.userLoggedIn).toBe(false);
  });

  it('sets and unsets loading', () => {
    let state = userReducer(userInitialState, loadingSet('Loading...'));
    expect(state.loadingSet).toBe(true);
    expect(state.loadingMsg).toBe('Loading...');
    state = userReducer(state, loadingUnset());
    expect(state.loadingSet).toBe(false);
  });

  it('sets and unsets password', () => {
    let state = userReducer(userInitialState, passwordSet());
    expect(state.passwordSet).toBe(true);
    state = userReducer(state, passwordUnset());
    expect(state.passwordSet).toBe(false);
  });

  it('handles seedphrase backup state', () => {
    let state = userReducer(userInitialState, seedphraseNotBackedUp());
    expect(state.seedphraseBackedUp).toBe(false);
    expect(state.backUpSeedphraseVisible).toBe(true);

    state = userReducer(state, seedphraseBackedUp());
    expect(state.seedphraseBackedUp).toBe(true);
    expect(state.backUpSeedphraseVisible).toBe(false);
  });

  it('toggles back up seedphrase alert visibility', () => {
    let state = userReducer(userInitialState, backUpSeedphraseAlertVisible());
    expect(state.backUpSeedphraseVisible).toBe(true);
    state = userReducer(state, backUpSeedphraseAlertNotVisible());
    expect(state.backUpSeedphraseVisible).toBe(false);
  });

  describe('protect wallet modal', () => {
    it('shows when the seedphrase is not backed up', () => {
      const state = userReducer(userInitialState, protectWalletModalVisible());
      expect(state.protectWalletModalVisible).toBe(true);
    });

    it('does not show when the seedphrase is backed up', () => {
      const backedUp = { ...userInitialState, seedphraseBackedUp: true };
      const state = userReducer(backedUp, protectWalletModalVisible());
      expect(state).toBe(backedUp);
    });

    it('hides the modal', () => {
      const state = userReducer(
        { ...userInitialState, protectWalletModalVisible: true },
        protectWalletModalNotVisible(),
      );
      expect(state.protectWalletModalVisible).toBe(false);
    });
  });

  it('marks gas education carousel as seen', () => {
    const state = userReducer(userInitialState, setGasEducationCarouselSeen());
    expect(state.gasEducationCarouselSeen).toBe(true);
  });

  it('sets the app theme', () => {
    const state = userReducer(userInitialState, setAppTheme(AppThemeKey.dark));
    expect(state.appTheme).toBe(AppThemeKey.dark);
  });

  it('marks app services as ready', () => {
    const state = userReducer(userInitialState, setAppServicesReady());
    expect(state.appServicesReady).toBe(true);
  });

  it('ignores saga-only actions', () => {
    expect(userReducer(userInitialState, lockApp())).toBe(userInitialState);
    expect(userReducer(userInitialState, authSuccess('id'))).toBe(
      userInitialState,
    );
    expect(userReducer(userInitialState, checkedAuth('Login'))).toBe(
      userInitialState,
    );
  });
});

describe('user actions', () => {
  it('creates payload actions', () => {
    expect(authSuccess('bio')).toEqual({
      type: UserActionType.AUTH_SUCCESS,
      payload: { bioStateMachineId: 'bio' },
    });
    expect(authError()).toEqual({
      type: UserActionType.AUTH_ERROR,
      payload: { bioStateMachineId: undefined },
    });
    expect(checkedAuth('Onboarding')).toEqual({
      type: UserActionType.CHECKED_AUTH,
      payload: { initialScreen: 'Onboarding' },
    });
    expect(setAppTheme(AppThemeKey.light)).toEqual({
      type: UserActionType.SET_APP_THEME,
      payload: { theme: AppThemeKey.light },
    });
    expect(loadingSet('msg')).toEqual({
      type: UserActionType.LOADING_SET,
      loadingMsg: 'msg',
    });
  });

  it('creates simple actions', () => {
    expect(interruptBiometrics().type).toBe(
      UserActionType.INTERRUPT_BIOMETRICS,
    );
    expect(lockApp().type).toBe(UserActionType.LOCKED_APP);
    expect(onPersistedDataLoaded().type).toBe(
      UserActionType.ON_PERSISTED_DATA_LOADED,
    );
    expect(setAppServicesReady().type).toBe(
      UserActionType.SET_APP_SERVICES_READY,
    );
  });
});
