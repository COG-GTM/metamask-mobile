import Engine from '../../Engine';
import BackgroundBridge from '../../BackgroundBridge/BackgroundBridge';
import { SDKConnect } from '../SDKConnect';
import AndroidService from './AndroidService';

let mockOnClientsConnected: ((clientInfo: string) => void) | undefined;
let mockOnMessage: ((message: string) => void) | undefined;

jest.mock('../../Engine', () => ({
  context: {
    KeyringController: { isUnlocked: jest.fn(() => true) },
    PermissionController: {
      requestPermissions: jest.fn(),
      hasPermission: jest.fn(),
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
jest.mock('../handlers/handleCustomRpcCalls', () =>
  jest.fn(async ({ rpc }) => rpc),
);
jest.mock('../../BackgroundBridge/BackgroundBridge');
jest.mock('../../../util/Logger');
jest.mock('../utils/DevLogger');

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const VALID_ID = '3f1c2a9e-8b7d-4c6e-9a5f-1b2c3d4e5f60';
const SPOOFED_IDS = [
  'MetaMask Mobile',
  'app.uniswap.org',
  'https://app.uniswap.org',
  `${VALID_ID} `,
  '',
];

const originatorInfo = {
  url: 'https://mallory.example',
  title: 'Mallory',
  platform: 'android',
  dappId: 'mallory',
};

const clientsConnected = (clientId: unknown) =>
  JSON.stringify({ clientId, originatorInfo });

const rpcMessage = (sessionId: string, method = 'eth_requestAccounts') =>
  JSON.stringify({
    id: sessionId,
    message: JSON.stringify({ id: '1', jsonrpc: '2.0', method, params: [] }),
  });

describe('AndroidService client id handling', () => {
  const permissionController = (
    Engine.context as unknown as {
      PermissionController: {
        requestPermissions: jest.Mock;
        hasPermission: jest.Mock;
      };
    }
  ).PermissionController;
  const MockBridge = BackgroundBridge as unknown as jest.Mock;

  let sdk: {
    loadDappConnections: jest.Mock;
    bindAndroidSDK: jest.Mock;
    isAndroidSDKBound: jest.Mock;
    addDappConnection: jest.Mock;
    setPendingDappConnection: jest.Mock;
    removeDappConnection: jest.Mock;
    state: { navigation: { navigate: jest.Mock } };
  };

  const start = async (stored: Record<string, unknown> = {}) => {
    sdk.loadDappConnections.mockResolvedValue(stored);
    const service = new AndroidService();
    await flushPromises();
    return service;
  };

  const emitClientsConnected = async (payload: string) => {
    if (!mockOnClientsConnected) throw new Error('listener not registered');
    mockOnClientsConnected(payload);
    await flushPromises();
  };

  const emitMessage = async (payload: string) => {
    if (!mockOnMessage) throw new Error('listener not registered');
    mockOnMessage(payload);
    await flushPromises();
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnClientsConnected = undefined;
    mockOnMessage = undefined;
    MockBridge.mockImplementation(() => ({ onMessage: jest.fn() }));
    sdk = {
      loadDappConnections: jest.fn().mockResolvedValue({}),
      bindAndroidSDK: jest.fn().mockResolvedValue(undefined),
      isAndroidSDKBound: jest.fn(() => true),
      addDappConnection: jest.fn().mockResolvedValue(undefined),
      setPendingDappConnection: jest.fn(),
      removeDappConnection: jest.fn(),
      state: { navigation: { navigate: jest.fn() } },
    };
    (SDKConnect.getInstance as jest.Mock).mockReturnValue(sdk);
    permissionController.requestPermissions.mockResolvedValue([{}]);
    permissionController.hasPermission.mockReturnValue(true);
  });

  describe('clients_connected', () => {
    it.each(SPOOFED_IDS)(
      'rejects non-UUID client id %p before storing, prompting or bridging',
      async (clientId) => {
        const service = await start();

        await emitClientsConnected(clientsConnected(clientId));

        expect(sdk.addDappConnection).not.toHaveBeenCalled();
        expect(sdk.setPendingDappConnection).not.toHaveBeenCalled();
        expect(permissionController.requestPermissions).not.toHaveBeenCalled();
        expect(MockBridge).not.toHaveBeenCalled();
        expect(service.connections).toStrictEqual({});
      },
    );

    it('rejects malformed client info', async () => {
      await start();

      await emitClientsConnected('not-json');
      await emitClientsConnected(JSON.stringify({ clientId: VALID_ID }));

      expect(permissionController.requestPermissions).not.toHaveBeenCalled();
      expect(sdk.addDappConnection).not.toHaveBeenCalled();
    });

    it('persists the connection only after the user approves', async () => {
      let approve: (value: unknown) => void = () => undefined;
      permissionController.requestPermissions.mockReturnValue(
        new Promise((resolve) => {
          approve = resolve;
        }),
      );
      const service = await start();

      await emitClientsConnected(clientsConnected(VALID_ID));

      expect(sdk.setPendingDappConnection).toHaveBeenCalledWith(
        expect.objectContaining({ id: VALID_ID }),
      );
      expect(permissionController.requestPermissions).toHaveBeenCalledWith(
        { origin: VALID_ID },
        expect.any(Object),
      );
      expect(sdk.addDappConnection).not.toHaveBeenCalled();
      expect(MockBridge).not.toHaveBeenCalled();

      approve([{}]);
      await flushPromises();

      expect(sdk.addDappConnection).toHaveBeenCalledTimes(1);
      expect(sdk.addDappConnection).toHaveBeenCalledWith(
        expect.objectContaining({ id: VALID_ID }),
      );
      expect(MockBridge).toHaveBeenCalledWith(
        expect.objectContaining({ channelId: VALID_ID, isMMSDK: true }),
      );
      expect(service.connections[VALID_ID]?.clientId).toBe(VALID_ID);
    });

    it('discards the connection when the user declines', async () => {
      permissionController.requestPermissions.mockRejectedValue(
        new Error('User rejected the request.'),
      );
      const service = await start();

      await emitClientsConnected(clientsConnected(VALID_ID));

      expect(sdk.addDappConnection).not.toHaveBeenCalled();
      expect(sdk.removeDappConnection).toHaveBeenCalledWith(VALID_ID);
      expect(MockBridge).not.toHaveBeenCalled();
      expect(service.connections[VALID_ID]).toBeUndefined();
      expect(service.bridgeByClientId[VALID_ID]).toBeUndefined();
    });
  });

  describe('restoring stored connections', () => {
    const stored = (id: string) => ({
      [id]: { id, originatorInfo, validUntil: Date.now() + 1000 },
    });

    it('restores a bridge for an approved UUID connection', async () => {
      const service = await start(stored(VALID_ID));

      expect(permissionController.hasPermission).toHaveBeenCalledWith(
        VALID_ID,
        'endowment:caip25',
      );
      expect(MockBridge).toHaveBeenCalledWith(
        expect.objectContaining({ channelId: VALID_ID }),
      );
      expect(service.connections[VALID_ID]).toBeDefined();
      expect(sdk.removeDappConnection).not.toHaveBeenCalled();
    });

    it('drops a stored connection that was never approved', async () => {
      permissionController.hasPermission.mockReturnValue(false);

      const service = await start(stored(VALID_ID));

      expect(MockBridge).not.toHaveBeenCalled();
      expect(service.connections).toStrictEqual({});
      expect(sdk.removeDappConnection).toHaveBeenCalledWith(VALID_ID);
    });

    it.each(['MetaMask Mobile', 'app.uniswap.org'])(
      'drops a stored connection with spoofed id %p',
      async (id) => {
        const service = await start(stored(id));

        expect(MockBridge).not.toHaveBeenCalled();
        expect(service.connections).toStrictEqual({});
        expect(sdk.removeDappConnection).toHaveBeenCalledWith(id);
      },
    );
  });

  describe('onMessageReceived', () => {
    it.each(['MetaMask Mobile', 'app.uniswap.org'])(
      'drops RPC from spoofed session id %p without prompting',
      async (sessionId) => {
        const service = await start();

        await emitMessage(rpcMessage(sessionId));

        expect(permissionController.requestPermissions).not.toHaveBeenCalled();
        expect(MockBridge).not.toHaveBeenCalled();
        expect(service.connections[sessionId]).toBeUndefined();
      },
    );

    it('drops RPC from a UUID session that never connected', async () => {
      const service = await start();

      await emitMessage(rpcMessage(VALID_ID));

      expect(permissionController.requestPermissions).not.toHaveBeenCalled();
      expect(MockBridge).not.toHaveBeenCalled();
      expect(service.connections[VALID_ID]).toBeUndefined();
    });

    it('forwards RPC from an approved session to its bridge', async () => {
      const onMessage = jest.fn();
      MockBridge.mockImplementation(() => ({ onMessage }));
      await start({
        [VALID_ID]: { id: VALID_ID, originatorInfo, validUntil: 0 },
      });

      await emitMessage(rpcMessage(VALID_ID));

      expect(onMessage).toHaveBeenCalledWith({
        name: 'metamask-provider',
        data: expect.objectContaining({ method: 'eth_requestAccounts' }),
      });
    });
  });
});
