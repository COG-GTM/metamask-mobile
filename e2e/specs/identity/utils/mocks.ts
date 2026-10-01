import { AuthenticationController } from '@metamask/profile-sync-controller';
import {
  MockttpServerLike,
  UserStorageMockttpController,
} from './user-storage/userStorageMockttpController';
import { getDecodedProxiedURL } from './helpers';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';

const AuthMocks = AuthenticationController.Mocks;

/**
 * E2E mock setup for identity APIs (Auth, UserStorage, Backup and sync)
 *
 * @param server - server obj used to mock our endpoints
 * @param userStorageMockttpController - optional controller to mock user storage endpoints
 */
export async function mockIdentityServices(server: MockttpServerLike) {
  // Auth
  mockAPICall(server, AuthMocks.getMockAuthNonceResponse());
  mockAPICall(server, AuthMocks.getMockAuthLoginResponse());
  mockAPICall(server, AuthMocks.getMockAuthAccessTokenResponse());

  // Storage
  const userStorageMockttpControllerInstance =
    new UserStorageMockttpController();

  userStorageMockttpControllerInstance.setupPath(
    USER_STORAGE_FEATURE_NAMES.accounts,
    server,
  );
  userStorageMockttpControllerInstance.setupPath(
    USER_STORAGE_FEATURE_NAMES.networks,
    server,
  );

  return {
    userStorageMockttpControllerInstance,
  };
}

function mockAPICall(
  server: MockttpServerLike,
  response: { requestMethod: string; url: string | RegExp; response: unknown },
) {
  let requestRuleBuilder:
    | ReturnType<MockttpServerLike['forGet']>
    | undefined;

  if (response.requestMethod === 'GET') {
    requestRuleBuilder = server.forGet('/proxy');
  }

  if (response.requestMethod === 'POST') {
    requestRuleBuilder = server.forPost('/proxy');
  }

  if (response.requestMethod === 'PUT') {
    requestRuleBuilder = server.forPut('/proxy');
  }

  if (response.requestMethod === 'DELETE') {
    requestRuleBuilder = server.forDelete('/proxy');
  }

  requestRuleBuilder
    ?.matching((request: unknown) => {
      const url = getDecodedProxiedURL((request as { url?: string }).url);

      return url.includes(String(response.url));
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: response.response,
    }));
}

const MOCK_ETH_BALANCE = '0xde0b6b3a7640000';
const INFURA_URL = 'https://mainnet.infura.io/v3/';

/**
 * Sets up mock responses for Infura balance checks and account syncing
 * @param {Object} mockServer - The server object to set up the mock responses on
 * @param {Array<String>} accounts - List of account addresses to mock balances for
 */
interface InfuraRequestBuilder {
  matching(predicate: (request: unknown) => unknown): InfuraRequestBuilder;
  always(): InfuraRequestBuilder;
  withJsonBodyIncluding(body: Record<string, unknown>): InfuraRequestBuilder;
  thenCallback(cb: (request: unknown) => unknown): unknown;
}

export interface InfuraMockServer extends MockttpServerLike {
  forPost(path: string | RegExp): InfuraRequestBuilder;
}

export const setupAccountMockedBalances = async (
  mockServer: InfuraMockServer,
  accounts: string[],
) => {
  if (!accounts.length) {
    return;
  }

  for (const account of accounts) {
    await mockServer
      .forPost('/proxy')
      .matching((request: unknown) => {
        const url = getDecodedProxiedURL((request as { url?: string }).url);
        return url.includes(INFURA_URL);
      })
      .withJsonBodyIncluding({
        method: 'eth_getBalance',
        params: [account.toLowerCase()],
      })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: MOCK_ETH_BALANCE,
        },
      }));
  }
};
