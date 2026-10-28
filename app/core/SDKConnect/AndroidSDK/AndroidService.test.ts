import { NativeModules } from 'react-native';
import Engine from '../../Engine';
import BackgroundBridge from '../../BackgroundBridge/BackgroundBridge';
import { SDKConnect } from '../SDKConnect';
import AndroidService from './AndroidService';

const mockOnMessageReceived = jest.fn();
const mockOnClientsConnected = jest.fn();

jest.mock('./AndroidNativeSDKEventHandler', () =>
  jest.fn().mockImplementation(() => ({
    onMessageReceived: mockOnMessageReceived,
    onClientsConnected: mockOnClientsConnected,
  })),
);
jest.mock('../../Engine', () => ({
  context: {},
}));
jest.mock('../SDKConnect', () => ({
  SDKConnect: { getInstance: jest.fn() },
}));
jest.mock('../../BackgroundBridge/BackgroundBridge', () =>
  jest.fn().mockImplementation(() => ({ onMessage: jest.fn() })),
);
jest.mock('./getDefaultBridgeParams', () => jest.fn(() => ({})));
jest.mock('../handlers/handleCustomRpcCalls', () =>
  jest.fn(async ({ rpc }) => rpc),
);
jest.mock('../../Permissions', () => ({
  getDefaultCaip25CaveatValue: jest.fn(() => ({})),
}));
jest.mock('../utils/wait.util', () => ({
  wait: jest.fn().mockResolvedValue(undefined),
  waitForAndroidServiceBinding: jest.fn().mockResolvedValue(undefined),
  waitForKeychainUnlocked: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../util/Logger');
jest.mock('../utils/DevLogger');

const APPROVED_ID = 'approved-dapp-session';
const APPROVED_ORIGINATOR = {
  url: 'https://acme-swap.example',
  title: 'Acme Swap',
  dappId: 'acme',
  platform: 'android',
};

const flush = async () => {
  for (let i = 0; i < 20; i++) {
    await new Promise((resolve) => setImmediate(resolve));
  }
};

const rpcMessage = (id: unknown, method = 'personal_sign') =>
  JSON.stringify({
    id,
    message: JSON.stringify({
      id: 'rpc-1',
      jsonrpc: '2.0',
      method,
      params: ['0xdeadbeef', '0x1'],
    }),
  });

describe('AndroidService session binding', () => {
  const mockNativeSendMessage = jest.fn();
  const mockRequestPermissions = jest.fn().mockResolvedValue(undefined);
  const MockBackgroundBridge = BackgroundBridge as unknown as jest.Mock;

  let service: AndroidService;
  let onMessage: (message: string) => void;

  beforeEach(async () => {
    jest.clearAllMocks();
    NativeModules.CommunicationClient = {
      sendMessage: mockNativeSendMessage,
    };
    (Engine as unknown as { context: unknown }).context = {
      KeyringController: {},
      PermissionController: { requestPermissions: mockRequestPermissions },
      AccountsController: {
        getSelectedAccount: () => ({
          address: '0x0000000000000000000000000000000000000001',
        }),
      },
      NetworkController: {
        state: { selectedNetworkClientId: 'mainnet' },
        getNetworkClientById: () => ({ configuration: { chainId: '0x1' } }),
      },
    };
    (SDKConnect.getInstance as jest.Mock).mockReturnValue({
      loadDappConnections: jest.fn().mockResolvedValue({
        [APPROVED_ID]: {
          id: APPROVED_ID,
          originatorInfo: APPROVED_ORIGINATOR,
          validUntil: Date.now() + 60_000,
        },
      }),
      bindAndroidSDK: jest.fn().mockResolvedValue(undefined),
      addDappConnection: jest.fn().mockResolvedValue(undefined),
      state: {},
    });

    service = new AndroidService();
    await flush();
    onMessage = mockOnMessageReceived.mock.calls[0][0];
    mockNativeSendMessage.mockClear();
  });

  it('dispatches requests for an approved session to that dapp bridge', async () => {
    const bridge = service.bridgeByClientId[APPROVED_ID] as unknown as {
      onMessage: jest.Mock;
    };

    onMessage(rpcMessage(APPROVED_ID));
    await flush();

    expect(bridge.onMessage).toHaveBeenCalledWith({
      name: 'metamask-provider',
      data: expect.objectContaining({ id: 'rpc-1', method: 'personal_sign' }),
    });
    expect(service.connections[APPROVED_ID].connected).toBe(true);
    expect(service.currentClientId).toBe(APPROVED_ID);
  });

  it.each([
    ['an unknown session id', 'attacker-chosen-id'],
    ['an empty session id', ''],
    ['a non-string session id', 42],
    ['a missing session id', undefined],
    ['a prototype key', '__proto__'],
    ['a prototype key', 'constructor'],
  ])('rejects messages carrying %s without prompting', async (_, id) => {
    const bridgeCount = MockBackgroundBridge.mock.calls.length;
    const connectionIds = Object.keys(service.connections);

    onMessage(rpcMessage(id));
    await flush();

    expect(mockRequestPermissions).not.toHaveBeenCalled();
    expect(MockBackgroundBridge.mock.calls.length).toBe(bridgeCount);
    expect(Object.keys(service.connections)).toEqual(connectionIds);
    expect(service.currentClientId).toBeUndefined();
    expect(mockNativeSendMessage).toHaveBeenCalledTimes(1);
    expect(JSON.parse(mockNativeSendMessage.mock.calls[0][0])).toEqual({
      name: 'metamask-provider',
      data: {
        id: 'rpc-1',
        jsonrpc: '2.0',
        error: { code: 4100, message: 'Unauthorized session' },
      },
    });
  });

  it('rejects messages for an expired approved session', async () => {
    const bridge = service.bridgeByClientId[APPROVED_ID] as unknown as {
      onMessage: jest.Mock;
    };
    service.connections[APPROVED_ID].validUntil = Date.now() - 1;

    onMessage(rpcMessage(APPROVED_ID));
    await flush();

    expect(bridge.onMessage).not.toHaveBeenCalled();
    expect(service.connections[APPROVED_ID].connected).not.toBe(true);
  });

  it('does not hand the approved dapp bridge to a forged session id', async () => {
    const bridge = service.bridgeByClientId[APPROVED_ID] as unknown as {
      onMessage: jest.Mock;
    };

    onMessage(rpcMessage(`${APPROVED_ID}-forged`, 'eth_accounts'));
    await flush();

    expect(bridge.onMessage).not.toHaveBeenCalled();
  });

  it('rebuilds a missing bridge only from the approved connection', async () => {
    delete service.bridgeByClientId[APPROVED_ID];

    onMessage(rpcMessage(APPROVED_ID));
    await flush();

    expect(mockRequestPermissions).toHaveBeenCalledWith(
      { origin: APPROVED_ID },
      expect.any(Object),
    );
    const rebuilt = service.bridgeByClientId[APPROVED_ID] as unknown as {
      onMessage: jest.Mock;
    };
    expect(rebuilt.onMessage).toHaveBeenCalledTimes(1);
    expect(MockBackgroundBridge).toHaveBeenLastCalledWith(
      expect.objectContaining({ channelId: APPROVED_ID }),
    );
  });
});
