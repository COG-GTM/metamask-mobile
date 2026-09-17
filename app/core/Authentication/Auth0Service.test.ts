import { Auth0Service } from './Auth0Service';
import SecureKeychain from '../SecureKeychain';

const mockAuthorize = jest.fn();
const mockClearSession = jest.fn();
const mockRefreshToken = jest.fn();

jest.mock('react-native-auth0', () =>
  jest.fn().mockImplementation(() => ({
    webAuth: {
      authorize: mockAuthorize,
      clearSession: mockClearSession,
    },
    auth: {
      refreshToken: mockRefreshToken,
    },
  })),
);

jest.mock('../SecureKeychain', () => ({
  setAuth0Credentials: jest.fn(),
  getAuth0Credentials: jest.fn(),
  resetAuth0Credentials: jest.fn(),
}));

const mockedKeychain = SecureKeychain as jest.Mocked<typeof SecureKeychain>;

const NOW = 1700000000000;
const inSeconds = (ms: number) => ms / 1000;
const config = {
  domain: 'metamask.eu.auth0.com',
  clientId: 'client-id',
};

describe('Auth0Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    mockedKeychain.getAuth0Credentials.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('is disabled when no Auth0 configuration is provided', async () => {
    const auth0 = new Auth0Service({ domain: '', clientId: '' });

    expect(auth0.isEnabled()).toBe(false);
    expect(await auth0.login()).toBeNull();
    expect(await auth0.getSession()).toBeNull();
    expect(await auth0.getAccessToken()).toBeNull();
    expect(mockAuthorize).not.toHaveBeenCalled();
  });

  it('stores credentials in the keychain on login', async () => {
    mockAuthorize.mockResolvedValue({
      accessToken: 'access-token',
      idToken: 'id-token',
      refreshToken: 'refresh-token',
      expiresAt: inSeconds(NOW + 3600000),
    });
    const auth0 = new Auth0Service(config);

    const session = await auth0.login();

    expect(mockAuthorize).toHaveBeenCalledWith(
      expect.objectContaining({ scope: expect.stringContaining('openid') }),
      { customScheme: 'metamaskauth0' },
    );
    expect(session?.accessToken).toBe('access-token');
    expect(session?.expiresAt).toBe(NOW + 3600000);
    expect(mockedKeychain.setAuth0Credentials).toHaveBeenCalledWith(session);
  });

  it('reuses a stored session that has not expired', async () => {
    mockedKeychain.getAuth0Credentials.mockResolvedValue({
      accessToken: 'stored-token',
      refreshToken: 'refresh-token',
      expiresAt: NOW + 3600000,
    });
    const auth0 = new Auth0Service(config);

    expect(await auth0.getAccessToken()).toBe('stored-token');
    expect(await auth0.isAuthenticated()).toBe(true);
    expect(mockRefreshToken).not.toHaveBeenCalled();
  });

  it('refreshes an expired access token', async () => {
    mockedKeychain.getAuth0Credentials.mockResolvedValue({
      accessToken: 'stale-token',
      refreshToken: 'refresh-token',
      expiresAt: NOW - 1000,
    });
    mockRefreshToken.mockResolvedValue({
      accessToken: 'fresh-token',
      expiresAt: inSeconds(NOW + 3600000),
    });
    const auth0 = new Auth0Service(config);

    expect(await auth0.getAccessToken()).toBe('fresh-token');
    expect(mockRefreshToken).toHaveBeenCalledWith({
      refreshToken: 'refresh-token',
    });
    expect(mockedKeychain.setAuth0Credentials).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'fresh-token',
        refreshToken: 'refresh-token',
      }),
    );
  });

  it('signs the user out when the refresh fails', async () => {
    mockedKeychain.getAuth0Credentials.mockResolvedValue({
      accessToken: 'stale-token',
      refreshToken: 'refresh-token',
      expiresAt: NOW - 1000,
    });
    mockRefreshToken.mockRejectedValue(new Error('invalid_grant'));
    const auth0 = new Auth0Service(config);

    expect(await auth0.getSession()).toBeNull();
    expect(mockedKeychain.resetAuth0Credentials).toHaveBeenCalled();
  });

  it('clears the browser session and stored tokens on logout', async () => {
    const auth0 = new Auth0Service(config);

    await auth0.logout();

    expect(mockClearSession).toHaveBeenCalledWith(
      {},
      { customScheme: 'metamaskauth0' },
    );
    expect(mockedKeychain.resetAuth0Credentials).toHaveBeenCalled();
  });

  it('does not expose the vault password keychain entry', async () => {
    mockAuthorize.mockResolvedValue({
      accessToken: 'access-token',
      expiresAt: inSeconds(NOW + 3600000),
    });
    const auth0 = new Auth0Service(config);

    await auth0.login();

    expect(
      (mockedKeychain as unknown as Record<string, unknown>)
        .setGenericPassword,
    ).toBeUndefined();
  });
});
