import AuthenticationError from './AuthenticationError';
import AUTHENTICATION_TYPE from '../../constants/userProperties';

describe('AuthenticationError', () => {
  it('stores the custom message and auth data', () => {
    const authData = { currentAuthType: AUTHENTICATION_TYPE.PASSWORD };
    const error = new AuthenticationError('message', 'custom', authData);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.message).toBe('message');
    expect(error.customErrorMessage).toBe('custom');
    expect(error.authData).toBe(authData);
  });
});
