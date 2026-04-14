import AuthenticationError from './AuthenticationError';

describe('AuthenticationError', () => {
  it('should create an error with message and auth data', () => {
    const authData = { type: 'biometrics', currentAuthType: 'biometrics' } as any;
    const error = new AuthenticationError('auth failed', 'Custom error message', authData);

    expect(error.message).toBe('auth failed');
    expect(error.customErrorMessage).toBe('Custom error message');
    expect(error.authData).toStrictEqual(authData);
    expect(error instanceof Error).toBe(true);
    expect(error instanceof AuthenticationError).toBe(true);
  });

  it('should have correct prototype chain', () => {
    const error = new AuthenticationError('test', 'custom', {} as any);
    expect(Object.getPrototypeOf(error)).toBe(AuthenticationError.prototype);
  });
});
