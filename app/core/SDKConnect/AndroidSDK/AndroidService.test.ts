import { EventType, MessageType } from '@metamask/sdk-communication-layer';

jest.mock('react-native', () => ({
  NativeModules: {
    CommunicationClient: { kind: 'native' },
    RCTDeviceEventEmitter: { addListener: jest.fn(), removeListeners: jest.fn() },
  },
  NativeEventEmitter: class MockNativeEventEmitter {
    addListener = jest.fn();
    removeAllListeners = jest.fn();
    removeListener = jest.fn();
    emit = jest.fn();
  },
  Platform: { OS: 'android' },
}));

jest.mock('../utils/DevLogger', () => ({
  __esModule: true,
  default: { log: jest.fn() },
}));

jest.mock('../../../util/Logger', () => ({
  __esModule: true,
  default: { log: jest.fn(), error: jest.fn() },
}));

jest.mock('../utils/wait.util', () => ({
  wait: jest.fn().mockResolvedValue(undefined),
  waitForAndroidServiceBinding: jest.fn().mockResolvedValue(undefined),
  waitForKeychainUnlocked: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../handlers/handleCustomRpcCalls', () =>
  jest.fn().mockResolvedValue({ id: '1', method: 'eth_accounts', params: [] }),
);

jest.mock('./AndroidService/sendMessage', () => jest.fn().mockResolvedValue(undefined));

jest.mock('../../BackgroundBridge/BackgroundBridge', () =>
  jest.fn().mockImplementation(() => ({
    onMessage: jest.fn(),
  })),
);

jest.mock('./getDefaultBridgeParams', () => jest.fn(() => ({})));

jest.mock('./AndroidNativeSDKEventHandler', () =>
  jest.fn().mockImplementation(() => ({
    onClientsConnected: jest.fn(),
    onMessageReceived: jest.fn(),
  })),
);

jest.mock('../SDKConnect', () => ({
  SDKConnect: {
    getInstance: jest.fn(() => ({
      loadDappConnections: jest.fn().mockResolvedValue({}),
      bindAndroidSDK: jest.fn().mockResolvedValue(undefined),
      addDappConnection: jest.fn().mockResolvedValue(undefined),
      state: { navigation: { navigate: jest.fn() } },
    })),
  },
}));

jest.mock('../../Engine', () => ({
  __esModule: true,
  default: {
    context: {
      KeyringController: {},
      PermissionController: { requestPermissions: jest.fn() },
      AccountsController: {
        getSelectedAccount: jest.fn().mockReturnValue({
          address: '0x0000000000000000000000000000000000000000',
        }),
      },
      NetworkController: {
        state: { selectedNetworkClientId: 'mainnet' },
        getNetworkClientById: jest
          .fn()
          .mockReturnValue({ configuration: { chainId: '0x1' } }),
      },
    },
  },
}));

jest.mock('@metamask/controller-utils', () => ({
  toChecksumHexAddress: jest.fn((v) => v.toUpperCase()),
}));

import AndroidService from './AndroidService';
import { SDKConnect } from '../SDKConnect';
import BackgroundBridge from '../../BackgroundBridge/BackgroundBridge';
import getDefaultBridgeParams from './getDefaultBridgeParams';
import sendMessage from './AndroidService/sendMessage';
import handleCustomRpcCalls from '../handlers/handleCustomRpcCalls';

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('AndroidService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('constructs an event handler and registers listeners', async () => {
    const service = new AndroidService();
    await flush();
    expect(service.eventHandler.onClientsConnected).toHaveBeenCalledWith(
      expect.any(Function),
    );
    expect(service.eventHandler.onMessageReceived).toHaveBeenCalledWith(
      expect.any(Function),
    );
  });

  it('getConnections returns only entries with a non-empty clientId', () => {
    const service = new AndroidService();
    service.connections = {
      a: {
        connected: true,
        clientId: 'a',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        originatorInfo: {} as any,
        validUntil: 0,
      },
      b: {
        connected: false,
        clientId: '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        originatorInfo: {} as any,
        validUntil: 0,
      },
    };

    const result = service.getConnections();
    expect(result).toHaveLength(1);
    expect(result[0].clientId).toBe('a');
  });

  it('setupBridge is idempotent per clientId', async () => {
    const service = new AndroidService();
    await flush();
    const client = {
      clientId: 'c1',
      connected: true,
      validUntil: 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      originatorInfo: { url: 'https://dapp', title: 'd' } as any,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).setupBridge(client);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).setupBridge(client);

    expect(BackgroundBridge).toHaveBeenCalledTimes(1);
    expect(getDefaultBridgeParams).toHaveBeenCalledTimes(1);
  });

  it('removeConnection deletes bridge and connection entries', async () => {
    const service = new AndroidService();
    await flush();

    service.connections.c1 = {
      connected: true,
      clientId: 'c1',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      originatorInfo: {} as any,
      validUntil: 0,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service.bridgeByClientId.c1 = { onMessage: jest.fn() } as any;

    await service.removeConnection('c1');

    expect(service.connections.c1).toBeUndefined();
    expect(service.bridgeByClientId.c1).toBeUndefined();
  });

  it('sendMessage delegates to the sendMessage util', async () => {
    const service = new AndroidService();
    await flush();
    const msg = { foo: 'bar' };

    await service.sendMessage(msg, true);
    expect(sendMessage).toHaveBeenCalledWith(service, msg, true);
  });

  it('onClientsConnected existing client: sends READY message without re-authenticating', async () => {
    const service = new AndroidService();
    await flush();
    const onClientsConnected = (service.eventHandler.onClientsConnected as jest.Mock)
      .mock.calls[0][0];

    service.connections.existing = {
      clientId: 'existing',
      connected: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      originatorInfo: {} as any,
      validUntil: 0,
    };

    const sendMessageSpy = jest
      .spyOn(service, 'sendMessage')
      .mockResolvedValue(undefined);

    await onClientsConnected(
      JSON.stringify({
        clientId: 'existing',
        connected: true,
        validUntil: 0,
        originatorInfo: {
          url: 'https://dapp',
          title: 'd',
          platform: 'web',
          source: 'src',
          dappId: 'd',
          icon: 'icon',
          apiVersion: '1',
        },
      }),
    );

    await flush();
    expect(sendMessageSpy).toHaveBeenCalledWith(
      {
        type: MessageType.READY,
        data: { id: 'existing' },
      },
      false,
    );
  });

  it('onMessageReceived forwards processed rpc to the bridge', async () => {
    const service = new AndroidService();
    await flush();
    const onMessageReceived = (service.eventHandler.onMessageReceived as jest.Mock)
      .mock.calls[0][0];

    const bridge = { onMessage: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service.bridgeByClientId['sess-1'] = bridge as any;
    service.connections['sess-1'] = {
      connected: false,
      clientId: 'sess-1',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      originatorInfo: {} as any,
      validUntil: 0,
    };

    await onMessageReceived(
      JSON.stringify({
        id: 'sess-1',
        message: JSON.stringify({
          id: '42',
          jsonrpc: '2.0',
          method: 'eth_accounts',
          params: [],
        }),
      }),
    );

    await flush();

    expect(handleCustomRpcCalls).toHaveBeenCalled();
    expect(bridge.onMessage).toHaveBeenCalledWith({
      name: 'metamask-provider',
      data: expect.objectContaining({ method: 'eth_accounts' }),
    });
    expect(service.currentClientId).toBe('sess-1');
  });

  it('onMessageReceived responds with an error message when JSON parsing fails', async () => {
    const service = new AndroidService();
    await flush();
    const onMessageReceived = (service.eventHandler.onMessageReceived as jest.Mock)
      .mock.calls[0][0];

    const sendMessageSpy = jest
      .spyOn(service, 'sendMessage')
      .mockResolvedValue(undefined);

    await onMessageReceived('not-json');
    await flush();

    expect(sendMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ error: expect.any(Error), jsonrpc: '2.0' }),
        name: 'metamask-provider',
      }),
    );
  });

  it('setupEventListeners still registers listeners when loadDappConnections throws', async () => {
    (SDKConnect.getInstance as jest.Mock).mockReturnValueOnce({
      loadDappConnections: jest.fn().mockRejectedValue(new Error('boom')),
      bindAndroidSDK: jest.fn().mockResolvedValue(undefined),
      state: { navigation: { navigate: jest.fn() } },
    });

    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const service = new AndroidService();
    await flush();
    await flush();

    expect(service.eventHandler.onClientsConnected).toHaveBeenCalled();
    expect(service.eventHandler.onMessageReceived).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});

// Keep the imports referenced so ESLint does not complain.
export const _referencedTypes = { EventType };
