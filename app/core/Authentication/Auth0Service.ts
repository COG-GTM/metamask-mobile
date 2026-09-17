import Auth0Client from 'react-native-auth0';
import SecureKeychain from '../SecureKeychain';
import Logger from '../../util/Logger';

/**
 * Optional cloud identity layer.
 *
 * This service is completely independent from `AuthenticationService`: it never
 * reads or writes the vault password and cannot unlock the local keyring vault.
 * See docs/auth0-identity-integration.md.
 */

export interface Auth0Config {
  domain: string;
  clientId: string;
  audience?: string;
  scope?: string;
}

export interface Auth0Session {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  /** Epoch milliseconds at which the access token expires */
  expiresAt: number;
  tokenType?: string;
  scope?: string;
}

export const AUTH0_CUSTOM_SCHEME = 'metamaskauth0';
export const AUTH0_DEFAULT_SCOPE = 'openid profile email offline_access';

const EXPIRY_LEEWAY_MS = 60 * 1000;

interface Auth0Credentials {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
}

const toSession = (
  credentials: Auth0Credentials,
  previous?: Auth0Session | null,
): Auth0Session => ({
  accessToken: credentials.accessToken,
  idToken: credentials.idToken,
  refreshToken: credentials.refreshToken ?? previous?.refreshToken,
  // react-native-auth0 reports expiresAt in epoch seconds
  expiresAt: (credentials.expiresAt ?? 0) * 1000,
  tokenType: credentials.tokenType,
  scope: credentials.scope,
});

export const auth0ConfigFromEnv = (): Auth0Config => ({
  domain: process.env.MM_AUTH0_DOMAIN ?? '',
  clientId: process.env.MM_AUTH0_CLIENT_ID ?? '',
  audience: process.env.MM_AUTH0_AUDIENCE,
  scope: process.env.MM_AUTH0_SCOPE,
});

class Auth0Service {
  private readonly config: Auth0Config;
  private client: Auth0Client | null = null;
  private session: Auth0Session | null = null;

  constructor(config: Auth0Config = auth0ConfigFromEnv()) {
    this.config = config;
  }

  private getClient(): Auth0Client {
    if (!this.isEnabled()) {
      throw new Error('Auth0 is not configured');
    }
    if (!this.client) {
      this.client = new Auth0Client({
        domain: this.config.domain,
        clientId: this.config.clientId,
      });
    }
    return this.client;
  }

  /**
   * Auth0 is opt-in: without build-time configuration every method below is a no-op.
   */
  isEnabled = (): boolean =>
    Boolean(this.config.domain && this.config.clientId);

  /**
   * Opens Auth0 Universal Login in the system browser and persists the resulting
   * tokens in the keychain.
   */
  login = async (): Promise<Auth0Session | null> => {
    if (!this.isEnabled()) return null;

    const credentials = await this.getClient().webAuth.authorize(
      {
        scope: this.config.scope ?? AUTH0_DEFAULT_SCOPE,
        audience: this.config.audience,
      },
      { customScheme: AUTH0_CUSTOM_SCHEME },
    );

    const session = toSession(credentials);
    await this.persist(session);
    return session;
  };

  /**
   * Clears the Auth0 browser session and the stored tokens. Does not touch the
   * wallet: the vault stays in whatever locked/unlocked state it was in.
   */
  logout = async (): Promise<void> => {
    if (this.isEnabled()) {
      try {
        await this.getClient().webAuth.clearSession(
          {},
          { customScheme: AUTH0_CUSTOM_SCHEME },
        );
      } catch (error) {
        Logger.log('Auth0: failed to clear browser session', error);
      }
    }
    this.session = null;
    await SecureKeychain.resetAuth0Credentials();
  };

  /**
   * Returns the current session, refreshing the access token when it is expired
   * or about to expire. Returns null when the user is not signed in to Auth0.
   */
  getSession = async (): Promise<Auth0Session | null> => {
    if (!this.isEnabled()) return null;

    if (!this.session) {
      this.session = await this.read();
    }
    if (!this.session) return null;

    if (Date.now() < this.session.expiresAt - EXPIRY_LEEWAY_MS) {
      return this.session;
    }
    return await this.refresh(this.session);
  };

  getAccessToken = async (): Promise<string | null> =>
    (await this.getSession())?.accessToken ?? null;

  isAuthenticated = async (): Promise<boolean> =>
    Boolean(await this.getSession());

  private refresh = async (
    session: Auth0Session,
  ): Promise<Auth0Session | null> => {
    if (!session.refreshToken) {
      await this.logout();
      return null;
    }
    try {
      const credentials = await this.getClient().auth.refreshToken({
        refreshToken: session.refreshToken,
      });
      const refreshed = toSession(credentials, session);
      await this.persist(refreshed);
      return refreshed;
    } catch (error) {
      Logger.log('Auth0: token refresh failed', error);
      await this.logout();
      return null;
    }
  };

  private persist = async (session: Auth0Session): Promise<void> => {
    this.session = session;
    await SecureKeychain.setAuth0Credentials(session);
  };

  private read = async (): Promise<Auth0Session | null> => {
    try {
      return await SecureKeychain.getAuth0Credentials();
    } catch (error) {
      Logger.log('Auth0: failed to read stored credentials', error);
      return null;
    }
  };
}

export { Auth0Service };
export const Auth0 = new Auth0Service();
