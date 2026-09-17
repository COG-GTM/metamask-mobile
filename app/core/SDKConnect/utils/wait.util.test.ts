import { KeyringController } from '@metamask/keyring-controller';
import { Connection } from '../Connection';
import { SDKConnect } from '../SDKConnect';
import {
  waitForAndroidServiceBinding,
  waitForAsyncCondition,
  waitForCondition,
  waitForConnectionReadiness,
  waitForKeychainUnlocked,
} from './wait.util';

jest.mock('../SDKConnect', () => ({
  SDKConnect: {
    getInstance: jest.fn(),
  },
}));

// Mock the entire wait.util module
jest.mock('./wait.util', () => {
  const originalModule = jest.requireActual('./wait.util');
  return {
    ...originalModule,
    wait: (_ms: number) => new Promise((resolve) => setTimeout(resolve, 10)),
  };
});

describe('wait.util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useFakeTimers({ legacyFakeTimers: true });
  });

  test('waitForCondition resolves when condition is true', async () => {
    let flag = false;
    const waitPromise = waitForCondition({ fn: () => flag, waitTime: 10 });

    flag = true;
    await jest.runAllTimersAsync();
    await waitPromise;

    expect(flag).toBe(true);
  });

  test('waitForAsyncCondition resolves when async condition is true', async () => {
    let flag = false;
    const waitPromise = waitForAsyncCondition({
      fn: async () => flag,
      waitTime: 10,
    });

    flag = true;
    await jest.runAllTimersAsync();
    await waitPromise;

    expect(flag).toBe(true);
  });

  test('waitForConnectionReadiness resolves when connection is ready', async () => {
    const connection = { isReady: false } as Connection;
    const waitPromise = waitForConnectionReadiness({
      connection,
      waitTime: 10,
    });

    connection.isReady = true;
    await jest.runAllTimersAsync();
    await waitPromise;

    expect(connection.isReady).toBe(true);
  });

  test('waitForKeychainUnlocked resolves when keychain is unlocked', async () => {
    const keyringController = {
      isUnlocked: jest.fn().mockReturnValue(false),
    } as unknown as KeyringController;

    const waitPromise = waitForKeychainUnlocked({
      keyringController,
      waitTime: 10,
    });

    keyringController.isUnlocked = jest.fn().mockReturnValue(true);
    await jest.runAllTimersAsync();
    await waitPromise;

    expect(keyringController.isUnlocked()).toBe(true);
  });

  test('waitForAndroidServiceBinding resolves when Android service is bound', async () => {
    const mockSDKConnect = {
      isAndroidSDKBound: jest.fn().mockReturnValue(false),
    };
    (SDKConnect.getInstance as jest.Mock).mockReturnValue(mockSDKConnect);

    const waitPromise = waitForAndroidServiceBinding(10);

    mockSDKConnect.isAndroidSDKBound.mockReturnValue(true);
    await jest.runAllTimersAsync();
    await waitPromise;

    expect(mockSDKConnect.isAndroidSDKBound()).toBe(true);
  });
});
