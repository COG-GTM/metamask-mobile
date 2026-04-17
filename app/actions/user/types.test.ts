import { UserActionType } from './types';

describe('UserActionType enum', () => {
  it('LOCKED_APP has correct value', () => {
    expect(UserActionType.LOCKED_APP).toBe('LOCKED_APP');
  });

  it('AUTH_SUCCESS has correct value', () => {
    expect(UserActionType.AUTH_SUCCESS).toBe('AUTH_SUCCESS');
  });

  it('AUTH_ERROR has correct value', () => {
    expect(UserActionType.AUTH_ERROR).toBe('AUTH_ERROR');
  });

  it('LOGIN has correct value', () => {
    expect(UserActionType.LOGIN).toBe('LOGIN');
  });

  it('LOGOUT has correct value', () => {
    expect(UserActionType.LOGOUT).toBe('LOGOUT');
  });

  it('PASSWORD_SET has correct value', () => {
    expect(UserActionType.PASSWORD_SET).toBe('PASSWORD_SET');
  });

  it('PASSWORD_UNSET has correct value', () => {
    expect(UserActionType.PASSWORD_UNSET).toBe('PASSWORD_UNSET');
  });

  it('SEEDPHRASE_BACKED_UP has correct value', () => {
    expect(UserActionType.SEEDPHRASE_BACKED_UP).toBe('SEEDPHRASE_BACKED_UP');
  });

  it('LOADING_SET has correct value', () => {
    expect(UserActionType.LOADING_SET).toBe('LOADING_SET');
  });

  it('SET_APP_THEME has correct value', () => {
    expect(UserActionType.SET_APP_THEME).toBe('SET_APP_THEME');
  });

  it('CHECKED_AUTH has correct value', () => {
    expect(UserActionType.CHECKED_AUTH).toBe('CHECKED_AUTH');
  });

  it('SET_APP_SERVICES_READY has correct value', () => {
    expect(UserActionType.SET_APP_SERVICES_READY).toBe('SET_APP_SERVICES_READY');
  });

  it('has all expected keys', () => {
    const expectedKeys = [
      'LOCKED_APP', 'AUTH_SUCCESS', 'AUTH_ERROR', 'INTERRUPT_BIOMETRICS',
      'LOGIN', 'LOGOUT', 'ON_PERSISTED_DATA_LOADED', 'PASSWORD_SET',
      'PASSWORD_UNSET', 'SEEDPHRASE_BACKED_UP', 'SEEDPHRASE_NOT_BACKED_UP',
      'BACK_UP_SEEDPHRASE_VISIBLE', 'BACK_UP_SEEDPHRASE_NOT_VISIBLE',
      'PROTECT_MODAL_VISIBLE', 'PROTECT_MODAL_NOT_VISIBLE',
      'LOADING_SET', 'LOADING_UNSET', 'SET_GAS_EDUCATION_CAROUSEL_SEEN',
      'SET_APP_THEME', 'CHECKED_AUTH', 'SET_APP_SERVICES_READY',
    ];
    expectedKeys.forEach((key) => {
      expect(UserActionType[key]).toBeDefined();
    });
  });
});
