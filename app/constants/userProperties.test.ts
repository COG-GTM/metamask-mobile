import AUTHENTICATION_TYPE from './userProperties';

describe('userProperties constants', () => {
  describe('AUTHENTICATION_TYPE', () => {
    it('defines BIOMETRIC', () => {
      expect(AUTHENTICATION_TYPE.BIOMETRIC).toBe('biometrics');
    });

    it('defines PASSCODE', () => {
      expect(AUTHENTICATION_TYPE.PASSCODE).toBe('device_passcode');
    });

    it('defines REMEMBER_ME', () => {
      expect(AUTHENTICATION_TYPE.REMEMBER_ME).toBe('remember_me');
    });

    it('defines PASSWORD', () => {
      expect(AUTHENTICATION_TYPE.PASSWORD).toBe('password');
    });

    it('defines UNKNOWN', () => {
      expect(AUTHENTICATION_TYPE.UNKNOWN).toBe('unknown');
    });
  });
});
