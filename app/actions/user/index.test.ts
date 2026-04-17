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
} from './index';

describe('user actions', () => {
  it('interruptBiometrics returns correct action', () => {
    expect(interruptBiometrics()).toEqual({
      type: UserActionType.INTERRUPT_BIOMETRICS,
    });
  });

  it('lockApp returns correct action', () => {
    expect(lockApp()).toEqual({
      type: UserActionType.LOCKED_APP,
    });
  });

  it('authSuccess returns correct action with bioStateMachineId', () => {
    const result = authSuccess('machine-1');
    expect(result.type).toBe(UserActionType.AUTH_SUCCESS);
    expect(result.payload.bioStateMachineId).toBe('machine-1');
  });

  it('authSuccess returns correct action without bioStateMachineId', () => {
    const result = authSuccess();
    expect(result.type).toBe(UserActionType.AUTH_SUCCESS);
    expect(result.payload.bioStateMachineId).toBeUndefined();
  });

  it('authError returns correct action with bioStateMachineId', () => {
    const result = authError('machine-2');
    expect(result.type).toBe(UserActionType.AUTH_ERROR);
    expect(result.payload.bioStateMachineId).toBe('machine-2');
  });

  it('passwordSet returns correct action', () => {
    expect(passwordSet()).toEqual({ type: UserActionType.PASSWORD_SET });
  });

  it('passwordUnset returns correct action', () => {
    expect(passwordUnset()).toEqual({ type: UserActionType.PASSWORD_UNSET });
  });

  it('seedphraseBackedUp returns correct action', () => {
    expect(seedphraseBackedUp()).toEqual({
      type: UserActionType.SEEDPHRASE_BACKED_UP,
    });
  });

  it('seedphraseNotBackedUp returns correct action', () => {
    expect(seedphraseNotBackedUp()).toEqual({
      type: UserActionType.SEEDPHRASE_NOT_BACKED_UP,
    });
  });

  it('backUpSeedphraseAlertVisible returns correct action', () => {
    expect(backUpSeedphraseAlertVisible()).toEqual({
      type: UserActionType.BACK_UP_SEEDPHRASE_VISIBLE,
    });
  });

  it('backUpSeedphraseAlertNotVisible returns correct action', () => {
    expect(backUpSeedphraseAlertNotVisible()).toEqual({
      type: UserActionType.BACK_UP_SEEDPHRASE_NOT_VISIBLE,
    });
  });

  it('protectWalletModalVisible returns correct action', () => {
    expect(protectWalletModalVisible()).toEqual({
      type: UserActionType.PROTECT_MODAL_VISIBLE,
    });
  });

  it('protectWalletModalNotVisible returns correct action', () => {
    expect(protectWalletModalNotVisible()).toEqual({
      type: UserActionType.PROTECT_MODAL_NOT_VISIBLE,
    });
  });

  it('loadingSet returns correct action with message', () => {
    const result = loadingSet('Loading...');
    expect(result.type).toBe(UserActionType.LOADING_SET);
    expect(result.loadingMsg).toBe('Loading...');
  });

  it('loadingUnset returns correct action', () => {
    expect(loadingUnset()).toEqual({ type: UserActionType.LOADING_UNSET });
  });

  it('setGasEducationCarouselSeen returns correct action', () => {
    expect(setGasEducationCarouselSeen()).toEqual({
      type: UserActionType.SET_GAS_EDUCATION_CAROUSEL_SEEN,
    });
  });

  it('logIn returns correct action', () => {
    expect(logIn()).toEqual({ type: UserActionType.LOGIN });
  });

  it('logOut returns correct action', () => {
    expect(logOut()).toEqual({ type: UserActionType.LOGOUT });
  });

  it('setAppTheme returns correct action', () => {
    const result = setAppTheme('dark');
    expect(result.type).toBe(UserActionType.SET_APP_THEME);
    expect(result.payload.theme).toBe('dark');
  });

  it('checkedAuth returns correct action', () => {
    const result = checkedAuth('login');
    expect(result.type).toBe(UserActionType.CHECKED_AUTH);
    expect(result.payload.initialScreen).toBe('login');
  });

  it('onPersistedDataLoaded returns correct action', () => {
    expect(onPersistedDataLoaded()).toEqual({
      type: UserActionType.ON_PERSISTED_DATA_LOADED,
    });
  });

  it('setAppServicesReady returns correct action', () => {
    expect(setAppServicesReady()).toEqual({
      type: UserActionType.SET_APP_SERVICES_READY,
    });
  });
});
