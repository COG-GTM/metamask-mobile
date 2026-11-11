import { Caip25EndowmentPermissionName } from '@metamask/chain-agnostic-permission';
import { providerErrors } from '@metamask/rpc-errors';
import Engine from '../../Engine';
import AppConstants from '../../AppConstants';
import BackgroundBridge from '../../BackgroundBridge/BackgroundBridge';
import { SDKConnect } from '../SDKConnect';
import AndroidService from './AndroidService';
import sendMessage from './AndroidService/sendMessage';

let mockOnClientsConnected: ((clientInfo: string) => void) | undefined;
let mockOnMessage: ((message: string) => void) | undefined;

jest.mock('../../Engine', () => ({
  context: {
    KeyringController: { isUnlocked: jest.fn(() => true) },
    PermissionController: {
      hasPermission: jest.fn(),
      hasPermissions: jest.fn(),
      requestPermissions: jest.fn(),
    },
    AccountsController: {
      getSelectedAccount: jest.fn(() => ({
        address: '0x0000000000000000000000000000000000000001',
      })),
    },
    NetworkController: {
      state: { selectedNetworkClientId: 'mainnet' },
      getNetworkClientById: jest.fn(() => ({
        configuration: { chainId: '0x1' },
      })),
    },
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
    onClientsConnected: jest.fn((cb: (clientInfo: string) => void) => {
      mockOnClientsConnected = cb;
    }),
  })),
);
jest.mock('./AndroidService/sendMessage', () =>
  jest.fn().mockResolvedValue(undefined),
);
jest.mock('./getDefaultBridgeParams', () => jest.fn(() => ({})));
jest.mock('../handlers/handleCustomRpcCalls', () =>
  jest.fn(async ({ rpc }) => rpc),
);
jest.mock('../../BackgroundBridge/BackgroundBridge', () =>
  jest.fn().mockImplementation(() => ({ onMessage: jest.fn() })),
);
jest.mock('../../Permissions', () => ({
  ...jest.requireActual('../../Permissions'),
  getDefaultCaip25CaveatValue: jest.fn(() => ({})),
}));
jest.mock('../../../util/Logger');
jest.mock('../utils/DevLogger');

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const CLIENT_ID = '70a863a4-a756-4660-8c72-dc367d02f625';
const originatorInfo = {
  url: 'https://dapp.example',
  title: 'Dapp',
  platform: 'android',
  dappId: 'dapp.example',
};

describe('AndroidService client approval', () => {
  const { PermissionController } = Engine.context as unknown as {
    PermissionController: {
      hasPermission: jest.Mock;
      hasPermissions: jest.Mock;
      requestPermissions: jest.Mock;
    };
  };
  const mockBackgroundBridge = BackgroundBridge as unknown as jest.Mock;
  const mockSendMessage = sendMessage as jest.Mock;

  let storedConnections: Record<string, Record<string, unknown>>;
  let sdkConnect: {
    loadDappConnections: jest.Mock;
    addDappConnection: jest.Mock;
    removeDappConnection: jest.Mock;
    bindAndroidSDK: jest.Mock;
    state: { navigation: { navigate: jest.Mock } };
  };
  let grantedOrigins: Set<string>;

  const startService = async () => {
    const service = new AndroidService();
    await flushPromises();
    return service;
  };

  const connectClient = async (clientId: string) => {
    mockOnClientsConnected?.(
      JSON.stringify({ clientId, originatorInfo, connected: true }),
    );
    await flushPromises();
  };

  const receive = async (id: string, method = 'eth_accounts') => {
    mockOnMessage?.(
      JSON.stringify({
        id,
        message: JSON.stringify({ id: '1', jsonrpc: '2.0', method }),
      }),
    );
    await flushPromises();
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnClientsConnected = undefined;
    mockOnMessage = undefined;
    storedConnections = {};
    grantedOrigins = new Set();

    PermissionController.hasPermission.mockImplementation(
      (origin: string, target: string) =>
        target === Caip25EndowmentPermissionName && grantedOrigins.has(origin),
    );
    PermissionController.hasPermissions.mockImplementation((origin: string) =>
      grantedOrigins.has(origin),
    );
    PermissionController.requestPermissions.mockRejectedValue(
      providerErrors.userRejectedRequest(),
    );

    sdkConnect = {
      loadDappConnections: jest.fn(async () => ({ ...storedConnections })),
      addDappConnection: jest.fn(async (connection) => {
        storedConnections[connection.id] = connection;
      }),
      removeDappConnection: jest.fn(async (id: string) => {
        delete storedConnections[id];
      }),
      bindAndroidSDK: jest.fn().mockResolvedValue(undefined),
      state: { navigation: { navigate: jest.fn() } },
    };
    (SDKConnect.getInstance as jest.Mock).mockReturnValue(sdkConnect);
  });

  it.each(['MetaMask Mobile', 'EXAMPLE_FOX_CODE', 'app.uniswap.org'])(
    'rejects the reserved or non-UUID client id %s without prompting or persisting',
    async (clientId) => {
      const service = await startService();

      await connectClient(clientId);
      await receive(clientId);

      expect(PermissionController.requestPermissions).not.toHaveBeenCalled();
      expect(sdkConnect.addDappConnection).not.toHaveBeenCalled();
      expect(service.bridgeByClientId[clientId]).toBeUndefined();
      expect(service.connections[clientId]).toBeUndefined();
      expect(mockSendMessage).toHaveBeenCalledWith(
        service,
        expect.objectContaining({
          data: expect.objectContaining({
            error: expect.objectContaining({
              code: providerErrors.unauthorized().code,
            }),
          }),
        }),
        undefined,
      );
    },
  );

  it('does not restore a client after the user rejected the connection', async () => {
    const service = await startService();

    await connectClient(CLIENT_ID);

    expect(PermissionController.requestPermissions).toHaveBeenCalledWith(
      { origin: CLIENT_ID },
      expect.anything(),
    );
    expect(sdkConnect.addDappConnection).not.toHaveBeenCalled();
    expect(storedConnections[CLIENT_ID]).toBeUndefined();
    expect(service.bridgeByClientId[CLIENT_ID]).toBeUndefined();

    mockBackgroundBridge.mockClear();
    const restarted = await startService();
    await receive(CLIENT_ID);

    expect(mockBackgroundBridge).not.toHaveBeenCalled();
    expect(restarted.bridgeByClientId[CLIENT_ID]).toBeUndefined();
  });

  it('drops stored Android clients that hold no connection permission on restart', async () => {
    storedConnections = {
      'MetaMask Mobile': {
        id: 'MetaMask Mobile',
        origin: AppConstants.MM_SDK.ANDROID_SDK,
        originatorInfo,
      },
      [CLIENT_ID]: {
        id: CLIENT_ID,
        origin: AppConstants.MM_SDK.ANDROID_SDK,
        originatorInfo,
      },
    };
    grantedOrigins.add('MetaMask Mobile');

    const service = await startService();

    expect(mockBackgroundBridge).not.toHaveBeenCalled();
    expect(service.connections).toEqual({});
    expect(sdkConnect.removeDappConnection).toHaveBeenCalledWith(
      'MetaMask Mobile',
    );
    expect(sdkConnect.removeDappConnection).toHaveBeenCalledWith(CLIENT_ID);
  });

  it('restores stored clients that still hold a connection permission', async () => {
    storedConnections = {
      [CLIENT_ID]: {
        id: CLIENT_ID,
        origin: AppConstants.MM_SDK.ANDROID_SDK,
        originatorInfo,
      },
    };
    grantedOrigins.add(CLIENT_ID);

    const service = await startService();
    await receive(CLIENT_ID);

    expect(service.bridgeByClientId[CLIENT_ID]).toBeDefined();
    expect(PermissionController.requestPermissions).not.toHaveBeenCalled();
    expect(service.bridgeByClientId[CLIENT_ID].onMessage).toHaveBeenCalled();
    expect(sdkConnect.removeDappConnection).not.toHaveBeenCalled();
  });

  it('persists a new client only after the user approves it', async () => {
    PermissionController.requestPermissions.mockImplementation(async () => {
      expect(sdkConnect.addDappConnection).not.toHaveBeenCalled();
      grantedOrigins.add(CLIENT_ID);
      return [{}];
    });
    const service = await startService();

    await connectClient(CLIENT_ID);

    expect(sdkConnect.addDappConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        id: CLIENT_ID,
        origin: AppConstants.MM_SDK.ANDROID_SDK,
      }),
    );
    expect(service.bridgeByClientId[CLIENT_ID]).toBeDefined();
  });

  it('refuses a client id already approved for another requester', async () => {
    grantedOrigins.add(CLIENT_ID);
    const service = await startService();

    await connectClient(CLIENT_ID);
    await receive(CLIENT_ID);

    expect(PermissionController.requestPermissions).not.toHaveBeenCalled();
    expect(sdkConnect.addDappConnection).not.toHaveBeenCalled();
    expect(service.bridgeByClientId[CLIENT_ID]).toBeUndefined();
  });

  it('rejects a valid unknown client that messages before connecting', async () => {
    const service = await startService();

    await receive(CLIENT_ID);

    expect(PermissionController.requestPermissions).not.toHaveBeenCalled();
    expect(sdkConnect.addDappConnection).not.toHaveBeenCalled();
    expect(service.connections[CLIENT_ID]).toBeUndefined();
    expect(service.bridgeByClientId[CLIENT_ID]).toBeUndefined();
    expect(mockSendMessage).toHaveBeenCalledWith(
      service,
      expect.objectContaining({
        data: expect.objectContaining({
          error: expect.objectContaining({
            code: providerErrors.unauthorized().code,
          }),
        }),
      }),
      undefined,
    );
  });

  it('keeps an approved client when a concurrent request for it is rejected', async () => {
    let approveFirst: (() => void) | undefined;
    PermissionController.requestPermissions
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            approveFirst = () => {
              grantedOrigins.add(CLIENT_ID);
              resolve([{}]);
            };
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            setImmediate(() => {
              approveFirst?.();
              setImmediate(() => reject(providerErrors.userRejectedRequest()));
            });
          }),
      );
    const service = await startService();

    await connectClient(CLIENT_ID);
    await connectClient(CLIENT_ID);
    await flushPromises();
    await flushPromises();

    expect(PermissionController.requestPermissions).toHaveBeenCalledTimes(2);
    expect(sdkConnect.removeDappConnection).not.toHaveBeenCalled();
    expect(storedConnections[CLIENT_ID]).toBeDefined();
    expect(service.connections[CLIENT_ID]).toBeDefined();
    expect(service.bridgeByClientId[CLIENT_ID]).toBeDefined();
  });

  it('re-prompts a known client whose bridge is missing', async () => {
    PermissionController.requestPermissions.mockImplementation(async () => {
      grantedOrigins.add(CLIENT_ID);
      return [{}];
    });
    const service = await startService();
    service.connections[CLIENT_ID] = {
      clientId: CLIENT_ID,
      connected: false,
      originatorInfo,
      validUntil: Date.now(),
    } as never;

    await receive(CLIENT_ID);

    expect(PermissionController.requestPermissions).toHaveBeenCalledWith(
      { origin: CLIENT_ID },
      expect.anything(),
    );
    expect(sdkConnect.addDappConnection).toHaveBeenCalledWith(
      expect.objectContaining({ id: CLIENT_ID, originatorInfo }),
    );
    expect(service.bridgeByClientId[CLIENT_ID].onMessage).toHaveBeenCalled();
  });
});
