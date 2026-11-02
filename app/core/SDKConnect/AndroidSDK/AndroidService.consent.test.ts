import { ConnectionProps } from '../Connection';
import { SDKConnect } from '../SDKConnect';
import { DEFAULT_SESSION_TIMEOUT_MS } from '../SDKConnectConstants';
import { store } from '../../../store';
import { updateDappConnection } from '../../../actions/sdk';
import Engine from '../../Engine';
import AndroidService from './AndroidService';
import addDappConnection from './addDappConnection';
import removeDappConnection from './removeDappConnection';
import sendMessage from './AndroidService/sendMessage';

let mockOnClientsConnected: ((clientInfo: string) => void) | undefined;

jest.mock('../../../store', () => {
  const { createStore, combineReducers } = jest.requireActual('redux');
  const sdk = jest.requireActual('../../../reducers/sdk').default;
  return { store: createStore(combineReducers({ sdk })) };
});
jest.mock('../../Engine', () => ({
  context: {
    KeyringController: { isUnlocked: jest.fn(() => true) },
    PermissionController: {
      requestPermissions: jest.fn(),
      getPermissions: jest.fn(),
      revokeAllPermissions: jest.fn(),
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
    onMessageReceived: jest.fn(),
    onClientsConnected: jest.fn((cb: (clientInfo: string) => void) => {
      mockOnClientsConnected = cb;
    }),
  })),
);
jest.mock('./AndroidService/sendMessage', () =>
  jest.fn().mockResolvedValue(undefined),
);
jest.mock('./getDefaultBridgeParams', () => jest.fn(() => ({})));
jest.mock('../../BackgroundBridge/BackgroundBridge');
jest.mock('../../Permissions', () => ({
  getDefaultCaip25CaveatValue: jest.fn(() => ({})),
}));
jest.mock('../../../util/Logger');
jest.mock('../utils/DevLogger');

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const CLIENT_ID = 'mallory-client';
const NOW = Date.now();

const permissionController = (
  Engine.context as unknown as {
    PermissionController: {
      requestPermissions: jest.Mock;
      getPermissions: jest.Mock;
      revokeAllPermissions: jest.Mock;
    };
  }
).PermissionController;

const persisted = () => store.getState().sdk.dappConnections;

const storedConnection = (
  id: string,
  validUntil: number | undefined,
): ConnectionProps =>
  ({
    id,
    lastAuthorized: NOW,
    origin: 'android-sdk',
    originatorInfo: { url: 'https://example.test', title: id },
    otherPublicKey: '',
    validUntil,
  } as unknown as ConnectionProps);

describe('AndroidService connection consent and persistence', () => {
  let mockInstance: {
    state: { dappConnections: Record<string, ConnectionProps> };
    loadDappConnections: jest.Mock;
    addDappConnection: jest.Mock;
    removeDappConnection: jest.Mock;
    bindAndroidSDK: jest.Mock;
    isAndroidSDKBound: jest.Mock;
  };

  const startService = async () => {
    const service = new AndroidService();
    await flushPromises();
    return service;
  };

  const connectClient = async (clientId = CLIENT_ID) => {
    if (!mockOnClientsConnected) {
      throw new Error('onClientsConnected listener was not registered');
    }
    mockOnClientsConnected(
      JSON.stringify({
        clientId,
        originatorInfo: { url: 'https://example.test', title: clientId },
        connected: true,
      }),
    );
    await flushPromises();
    await flushPromises();
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnClientsConnected = undefined;
    store.dispatch({ type: 'RESET_DAPP_CONNECTIONS', connections: {} });
    permissionController.getPermissions.mockReturnValue(undefined);

    mockInstance = {
      state: { dappConnections: {} },
      loadDappConnections: jest.fn(async () => persisted()),
      addDappConnection: jest.fn(),
      removeDappConnection: jest.fn(),
      bindAndroidSDK: jest.fn().mockResolvedValue(undefined),
      isAndroidSDKBound: jest.fn(() => true),
    };
    mockInstance.addDappConnection.mockImplementation(
      async (connection: ConnectionProps) =>
        addDappConnection(connection, mockInstance as unknown as never),
    );
    mockInstance.removeDappConnection.mockImplementation((id: string) =>
      removeDappConnection(id, mockInstance as unknown as never),
    );
    (SDKConnect.getInstance as jest.Mock).mockReturnValue(mockInstance);
  });

  it('does not persist a new client that the user rejects', async () => {
    let persistedDuringPrompt: unknown;
    permissionController.requestPermissions.mockImplementation(async () => {
      persistedDuringPrompt = persisted()[CLIENT_ID];
      throw new Error('User rejected the request.');
    });
    const service = await startService();

    await connectClient();

    expect(permissionController.requestPermissions).toHaveBeenCalledTimes(1);
    expect(persistedDuringPrompt).toBeUndefined();
    expect(persisted()[CLIENT_ID]).toBeUndefined();
    expect(mockInstance.addDappConnection).not.toHaveBeenCalled();
    expect(service.connections[CLIENT_ID]).toBeUndefined();
    expect(service.bridgeByClientId[CLIENT_ID]).toBeUndefined();
  });

  it('a rejected client is not restored on the next launch', async () => {
    permissionController.requestPermissions.mockRejectedValue(
      new Error('User rejected the request.'),
    );
    await startService();
    await connectClient();

    const relaunched = await startService();

    expect(relaunched.connections[CLIENT_ID]).toBeUndefined();
    expect(relaunched.bridgeByClientId[CLIENT_ID]).toBeUndefined();
  });

  it('removes a stale persisted entry when the user rejects', async () => {
    permissionController.requestPermissions.mockRejectedValue(
      new Error('User rejected the request.'),
    );
    await startService();
    store.dispatch(
      updateDappConnection(
        CLIENT_ID,
        storedConnection(CLIENT_ID, NOW + DEFAULT_SESSION_TIMEOUT_MS),
      ),
    );

    await connectClient();

    expect(persisted()[CLIENT_ID]).toBeUndefined();
  });

  it('persists the client only after approval, with a bounded validUntil', async () => {
    let persistedDuringPrompt: unknown;
    permissionController.requestPermissions.mockImplementation(async () => {
      persistedDuringPrompt = persisted()[CLIENT_ID];
      return [{}];
    });
    const service = await startService();

    await connectClient();

    expect(persistedDuringPrompt).toBeUndefined();
    expect(mockInstance.addDappConnection).toHaveBeenCalledTimes(1);
    expect(persisted()[CLIENT_ID]).toMatchObject({
      id: CLIENT_ID,
      validUntil: NOW + DEFAULT_SESSION_TIMEOUT_MS,
    });
    expect(service.connections[CLIENT_ID].validUntil).toBe(
      NOW + DEFAULT_SESSION_TIMEOUT_MS,
    );
    expect(service.bridgeByClientId[CLIENT_ID]).toBeDefined();
  });

  it('drops expired or undated stored connections at startup without a bridge', async () => {
    store.dispatch(
      updateDappConnection('expired', storedConnection('expired', NOW - 1)),
    );
    store.dispatch(
      updateDappConnection('undated', storedConnection('undated', undefined)),
    );
    store.dispatch(
      updateDappConnection(
        'valid',
        storedConnection('valid', NOW + DEFAULT_SESSION_TIMEOUT_MS),
      ),
    );
    permissionController.getPermissions.mockImplementation((origin: string) =>
      origin === 'expired' ? { some: 'permission' } : undefined,
    );

    const service = await startService();

    expect(Object.keys(service.connections)).toEqual(['valid']);
    expect(Object.keys(service.bridgeByClientId)).toEqual(['valid']);
    expect(Object.keys(persisted())).toEqual(['valid']);
    expect(permissionController.revokeAllPermissions).toHaveBeenCalledWith(
      'expired',
    );
    expect(sendMessage).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: { id: 'expired' } }),
      false,
    );
  });

  it('asks for approval again when a known client reconnects after its session expired', async () => {
    store.dispatch(
      updateDappConnection(
        CLIENT_ID,
        storedConnection(CLIENT_ID, NOW + DEFAULT_SESSION_TIMEOUT_MS),
      ),
    );
    permissionController.requestPermissions.mockRejectedValue(
      new Error('User rejected the request.'),
    );
    const service = await startService();
    expect(service.bridgeByClientId[CLIENT_ID]).toBeDefined();

    service.connections[CLIENT_ID].validUntil = NOW - 1;
    await connectClient();

    expect(permissionController.requestPermissions).toHaveBeenCalledTimes(1);
    expect(service.bridgeByClientId[CLIENT_ID]).toBeUndefined();
    expect(persisted()[CLIENT_ID]).toBeUndefined();
  });

  it('reuses a known, unexpired client without prompting', async () => {
    store.dispatch(
      updateDappConnection(
        CLIENT_ID,
        storedConnection(CLIENT_ID, NOW + DEFAULT_SESSION_TIMEOUT_MS),
      ),
    );
    const service = await startService();

    await connectClient();

    expect(permissionController.requestPermissions).not.toHaveBeenCalled();
    expect(service.bridgeByClientId[CLIENT_ID]).toBeDefined();
    expect(persisted()[CLIENT_ID]).toBeDefined();
  });
});
