import Engine from '../../Engine';
import { SDKConnect } from '../SDKConnect';
import {
  wait,
  waitForAndroidServiceBinding,
  waitForKeychainUnlocked,
} from '../utils/wait.util';
import AndroidService from './AndroidService';
import sendMessage from './AndroidService/sendMessage';

let mockOnMessage: ((message: string) => void) | undefined;

jest.mock('../../Engine', () => ({
  context: {
    KeyringController: { isUnlocked: jest.fn() },
  },
}));
jest.mock('../SDKConnect', () => ({
  SDKConnect: { getInstance: jest.fn() },
}));
jest.mock('../utils/wait.util', () => ({
  wait: jest.fn().mockResolvedValue(undefined),
  waitForAndroidServiceBinding: jest.fn().mockResolvedValue(undefined),
  waitForKeychainUnlocked: jest.fn().mockResolvedValue(true),
}));
jest.mock('./AndroidNativeSDKEventHandler', () =>
  jest.fn().mockImplementation(() => ({
    onMessageReceived: jest.fn((cb: (message: string) => void) => {
      mockOnMessage = cb;
    }),
    onClientsConnected: jest.fn(),
  })),
);
jest.mock('./AndroidService/sendMessage', () =>
  jest.fn().mockResolvedValue(undefined),
);
jest.mock('../../BackgroundBridge/BackgroundBridge');
jest.mock('../../../util/Logger');
jest.mock('../utils/DevLogger');

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('AndroidService onMessageReceived readiness wait', () => {
  const mockIsUnlocked = (
    Engine.context as unknown as {
      KeyringController: { isUnlocked: jest.Mock };
    }
  ).KeyringController.isUnlocked;
  const mockIsAndroidSDKBound = jest.fn();
  const mockWait = wait as jest.Mock;
  const mockWaitForBinding = waitForAndroidServiceBinding as jest.Mock;
  const mockWaitForUnlock = waitForKeychainUnlocked as jest.Mock;
  const mockSendMessage = sendMessage as jest.Mock;

  const receive = async (message = 'not-json') => {
    if (!mockOnMessage) {
      throw new Error('onMessageReceived listener was not registered');
    }
    mockOnMessage(message);
    await flushPromises();
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockOnMessage = undefined;
    mockIsUnlocked.mockReturnValue(true);
    mockIsAndroidSDKBound.mockReturnValue(true);
    (SDKConnect.getInstance as jest.Mock).mockReturnValue({
      loadDappConnections: jest.fn().mockResolvedValue({}),
      bindAndroidSDK: jest.fn().mockResolvedValue(undefined),
      isAndroidSDKBound: mockIsAndroidSDKBound,
    });

    new AndroidService();
    await flushPromises();
    mockWait.mockClear();
    mockWaitForBinding.mockClear();
    mockWaitForUnlock.mockClear();
  });

  it('applies the UI-ready delay and readiness waits to the first message', async () => {
    await receive();

    expect(mockWait).toHaveBeenCalledTimes(1);
    expect(mockWait).toHaveBeenCalledWith(200);
    expect(mockWaitForBinding).toHaveBeenCalledTimes(1);
    expect(mockWaitForUnlock).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  it('processes later messages without sleeping once bound and unlocked', async () => {
    await receive();
    mockWait.mockClear();
    mockWaitForBinding.mockClear();
    mockWaitForUnlock.mockClear();

    await receive();
    await receive();
    await receive();

    expect(mockWait).not.toHaveBeenCalled();
    expect(mockWaitForBinding).not.toHaveBeenCalled();
    expect(mockWaitForUnlock).not.toHaveBeenCalled();
    expect(mockSendMessage).toHaveBeenCalledTimes(4);
  });

  it('waits again when the keychain gets locked after startup', async () => {
    await receive();
    mockWait.mockClear();
    mockWaitForUnlock.mockClear();

    mockIsUnlocked.mockReturnValue(false);
    await receive();

    expect(mockWait).toHaveBeenCalledWith(200);
    expect(mockWaitForUnlock).toHaveBeenCalledTimes(1);
  });

  it('waits again when the Android service binding is lost', async () => {
    await receive();
    mockWait.mockClear();
    mockWaitForBinding.mockClear();

    mockIsAndroidSDKBound.mockReturnValue(false);
    await receive();

    expect(mockWait).toHaveBeenCalledWith(200);
    expect(mockWaitForBinding).toHaveBeenCalledTimes(1);
  });
});
