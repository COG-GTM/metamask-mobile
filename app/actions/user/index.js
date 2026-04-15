
import {





















  UserActionType } from
'./types';

export * from './types';

export function interruptBiometrics() {
  return {
    type: UserActionType.INTERRUPT_BIOMETRICS
  };
}

export function lockApp() {
  return {
    type: UserActionType.LOCKED_APP
  };
}

export function authSuccess(bioStateMachineId) {
  return {
    type: UserActionType.AUTH_SUCCESS,
    payload: { bioStateMachineId }
  };
}

export function authError(bioStateMachineId) {
  return {
    type: UserActionType.AUTH_ERROR,
    payload: { bioStateMachineId }
  };
}

export function passwordSet() {
  return {
    type: UserActionType.PASSWORD_SET
  };
}

export function passwordUnset() {
  return {
    type: UserActionType.PASSWORD_UNSET
  };
}

export function seedphraseBackedUp() {
  return {
    type: UserActionType.SEEDPHRASE_BACKED_UP
  };
}

export function seedphraseNotBackedUp() {
  return {
    type: UserActionType.SEEDPHRASE_NOT_BACKED_UP
  };
}

export function backUpSeedphraseAlertVisible() {
  return {
    type: UserActionType.BACK_UP_SEEDPHRASE_VISIBLE
  };
}

export function backUpSeedphraseAlertNotVisible() {
  return {
    type: UserActionType.BACK_UP_SEEDPHRASE_NOT_VISIBLE
  };
}

export function protectWalletModalVisible() {
  return {
    type: UserActionType.PROTECT_MODAL_VISIBLE
  };
}

export function protectWalletModalNotVisible() {
  return {
    type: UserActionType.PROTECT_MODAL_NOT_VISIBLE
  };
}

export function loadingSet(loadingMsg) {
  return {
    type: UserActionType.LOADING_SET,
    loadingMsg
  };
}

export function loadingUnset() {
  return {
    type: UserActionType.LOADING_UNSET
  };
}

export function setGasEducationCarouselSeen() {
  return {
    type: UserActionType.SET_GAS_EDUCATION_CAROUSEL_SEEN
  };
}

export function logIn() {
  return {
    type: UserActionType.LOGIN
  };
}

export function logOut() {
  return {
    type: UserActionType.LOGOUT
  };
}

export function setAppTheme(theme) {
  return {
    type: UserActionType.SET_APP_THEME,
    payload: { theme }
  };
}

/**
 * Temporary action to control auth flow
 *
 * @param initialScreen - "login" or "onboarding"
 */
export function checkedAuth(initialScreen) {
  return {
    type: UserActionType.CHECKED_AUTH,
    payload: {
      initialScreen
    }
  };
}

/**
 * Action to signal that persisted data has been loaded
 */
export function onPersistedDataLoaded() {
  return {
    type: UserActionType.ON_PERSISTED_DATA_LOADED
  };
}

/**
 * Action to signal that app services are ready
 */
export function setAppServicesReady() {
  return {
    type: UserActionType.SET_APP_SERVICES_READY
  };
}