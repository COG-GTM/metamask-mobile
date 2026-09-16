import { AuthenticationController } from '@metamask/profile-sync-controller';

const AuthMocks = AuthenticationController.Mocks;

export interface MockResponse {
  /** The URL endpoint for the mock response */
  urlEndpoint: string;
  /** The mock response data */
  response: object;
  /** The HTTP response code */
  responseCode: number;
}

export interface AuthMocksByMethod {
  /** Array of GET method mock responses */
  GET: MockResponse[];
  /** Array of POST method mock responses */
  POST: MockResponse[];
}

interface AuthMocksOptions {
  /** Custom nonce response */
  nonceResponse?: ReturnType<typeof AuthMocks.getMockAuthNonceResponse>;
  /** Custom login response */
  loginResponse?: ReturnType<typeof AuthMocks.getMockAuthLoginResponse>;
  /** Custom access token response */
  accessTokenResponse?: ReturnType<
    typeof AuthMocks.getMockAuthAccessTokenResponse
  >;
}

/**
 * Get authentication related mocks with optional custom responses
 * @param options - Configuration options
 * @returns Authentication mocks organized by HTTP method
 */
export const getAuthMocks = ({
  nonceResponse,
  loginResponse,
  accessTokenResponse,
}: AuthMocksOptions = {}): AuthMocksByMethod => {
  const authNonceResponse =
    nonceResponse || AuthMocks.getMockAuthNonceResponse();
  const authLoginResponse =
    loginResponse || AuthMocks.getMockAuthLoginResponse();
  const authAccessTokenResponse =
    accessTokenResponse || AuthMocks.getMockAuthAccessTokenResponse();

  return {
    GET: [
      {
        urlEndpoint: authNonceResponse.url,
        response: authNonceResponse.response,
        responseCode: 200,
      },
    ],
    POST: [
      {
        urlEndpoint: authLoginResponse.url,
        response: authLoginResponse.response,
        responseCode: 200,
      },
      {
        urlEndpoint: authAccessTokenResponse.url,
        response: authAccessTokenResponse.response,
        responseCode: 200,
      },
    ],
  };
};
