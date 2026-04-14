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
} from '.';

describe('User Actions', () => {
  it('interruptBiometrics should return correct action', () => {
    expect(interruptBiometrics()).toStrictEqual({
      type: UserActionType.INTERRUPT_BIOMETRICS,
    });
  });

  it('lockApp should return correct action', () => {
    expect(lockApp()).toStrictEqual({ type: UserActionType.LOCKED_APP });
  });

  it('authSuccess should return correct action with bioStateMachineId', () => {
    expect(authSuccess('bio-123')).toStrictEqual({
      type: UserActionType.AUTH_SUCCESS,
      payload: { bioStateMachineId: 'bio-123' },
    });
  });

  it('authSuccess should handle undefined bioStateMachineId', () => {
    expect(authSuccess()).toStrictEqual({
      type: UserActionType.AUTH_SUCCESS,
      payload: { bioStateMachineId: undefined },
    });
  });

  it('authError should return correct action', () => {
    expect(authError('bio-456')).toStrictEqual({
      type: UserActionType.AUTH_ERROR,
      payload: { bioStateMachineId: 'bio-456' },
    });
  });

  it('passwordSet should return correct action', () => {
    expect(passwordSet()).toStrictEqual({ type: UserActionType.PASSWORD_SET });
  });

  it('passwordUnset should return correct action', () => {
    expect(passwordUnset()).toStrictEqual({ type: UserActionType.PASSWORD_UNSET });
  });

  it('seedphraseBackedUp should return correct action', () => {
    expect(seedphraseBackedUp()).toStrictEqual({ type: UserActionType.SEEDPHRASE_BACKED_UP });
  });

  it('seedphraseNotBackedUp should return correct action', () => {
    expect(seedphraseNotBackedUp()).toStrictEqual({ type: UserActionType.SEEDPHRASE_NOT_BACKED_UP });
  });

  it('backUpSeedphraseAlertVisible should return correct action', () => {
    expect(backUpSeedphraseAlertVisible()).toStrictEqual({
      type: UserActionType.BACK_UP_SEEDPHRASE_VISIBLE,
    });
  });

  it('backUpSeedphraseAlertNotVisible should return correct action', () => {
    expect(backUpSeedphraseAlertNotVisible()).toStrictEqual({
      type: UserActionType.BACK_UP_SEEDPHRASE_NOT_VISIBLE,
    });
  });

  it('protectWalletModalVisible should return correct action', () => {
    expect(protectWalletModalVisible()).toStrictEqual({
      type: UserActionType.PROTECT_MODAL_VISIBLE,
    });
  });

  it('protectWalletModalNotVisible should return correct action', () => {
    expect(protectWalletModalNotVisible()).toStrictEqual({
      type: UserActionType.PROTECT_MODAL_NOT_VISIBLE,
    });
  });

  it('loadingSet should return correct action', () => {
    expect(loadingSet('Loading...')).toStrictEqual({
      type: UserActionType.LOADING_SET,
      loadingMsg: 'Loading...',
    });
  });

  it('loadingUnset should return correct action', () => {
    expect(loadingUnset()).toStrictEqual({ type: UserActionType.LOADING_UNSET });
  });

  it('setGasEducationCarouselSeen should return correct action', () => {
    expect(setGasEducationCarouselSeen()).toStrictEqual({
      type: UserActionType.SET_GAS_EDUCATION_CAROUSEL_SEEN,
    });
  });

  it('logIn should return correct action', () => {
    expect(logIn()).toStrictEqual({ type: UserActionType.LOGIN });
  });

  it('logOut should return correct action', () => {
    expect(logOut()).toStrictEqual({ type: UserActionType.LOGOUT });
  });

  it('setAppTheme should return correct action', () => {
    expect(setAppTheme('dark' as any)).toStrictEqual({
      type: UserActionType.SET_APP_THEME,
      payload: { theme: 'dark' },
    });
  });

  it('checkedAuth should return correct action', () => {
    expect(checkedAuth('login')).toStrictEqual({
      type: UserActionType.CHECKED_AUTH,
      payload: { initialScreen: 'login' },
    });
  });

  it('onPersistedDataLoaded should return correct action', () => {
    expect(onPersistedDataLoaded()).toStrictEqual({
      type: UserActionType.ON_PERSISTED_DATA_LOADED,
    });
  });

  it('setAppServicesReady should return correct action', () => {
    expect(setAppServicesReady()).toStrictEqual({
      type: UserActionType.SET_APP_SERVICES_READY,
    });
  });
});
