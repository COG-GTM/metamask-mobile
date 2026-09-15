import { AuthenticationController } from '@metamask/profile-sync-controller';
import { UserStorageMockttpController } from './user-storage/userStorageMockttpController';
import { getDecodedProxiedURL } from './helpers';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import type { Mockttp, RequestRuleBuilder } from 'mockttp';

const AuthMocks = AuthenticationController.Mocks;

interface MockResponse {
  url: string | RegExp;
  requestMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  response: unknown;
}

/**
 * E2E mock setup for identity APIs (Auth, UserStorage, Backup and sync)
 *
 * @param server - server obj used to mock our endpoints
 * @param userStorageMockttpController - optional controller to mock user storage endpoints
 */
export async function mockIdentityServices(server: Mockttp) {
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

function mockAPICall(server: Mockttp, response: MockResponse) {
  let requestRuleBuilder: RequestRuleBuilder | undefined;

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
    ?.matching((request) => {
      const url = getDecodedProxiedURL(request.url);

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
 * @param mockServer - The server object to set up the mock responses on
 * @param accounts - List of account addresses to mock balances for
 */
export const setupAccountMockedBalances = async (
  mockServer: Mockttp,
  accounts: string[],
) => {
  if (!accounts.length) {
    return;
  }

  for (const account of accounts) {
    await mockServer
      .forPost('/proxy')
      .matching((request) => {
        const url = getDecodedProxiedURL(request.url);
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
