/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventType } from '@metamask/sdk-communication-layer';
import AppConstants from '../../AppConstants';
import Engine from '../../Engine';
import BackgroundBridge from '../../BackgroundBridge/BackgroundBridge';
import { SDKConnect } from '../SDKConnect';
import { store } from '../../../store';
import AndroidService from './AndroidService';

const mockClientsConnected: ((clientInfo: string) => Promise<void>)[] = [];
const mockMessageReceived: ((message: string) => void)[] = [];

jest.mock('./AndroidNativeSDKEventHandler', () =>
  jest.fn().mockImplementation(() => ({
    onClientsConnected: (cb: any) => mockClientsConnected.push(cb),
    onMessageReceived: (cb: any) => mockMessageReceived.push(cb),
  })),
);
jest.mock('../../Engine', () => ({
  __esModule: true,
  default: { context: {} },
}));
jest.mock('../SDKConnect', () => {
  const instance = {
    state: { dappConnections: {}, navigation: { navigate: jest.fn() } },
    loadDappConnections: jest.fn(),
    addDappConnection: jest.fn(),
    bindAndroidSDK: jest.fn(),
  };
  return {
    __esModule: true,
    SDKConnect: { getInstance: () => instance },
    default: { getInstance: () => instance },
  };
});
jest.mock('../../../store', () => ({ store: { dispatch: jest.fn() } }));
jest.mock('../utils/wait.util', () => ({
  wait: jest.fn().mockResolvedValue(undefined),
  waitForAndroidServiceBinding: jest.fn().mockResolvedValue(undefined),
  waitForKeychainUnlocked: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../BackgroundBridge/BackgroundBridge', () =>
  jest.fn().mockImplementation(() => ({ onMessage: jest.fn() })),
);
jest.mock('./getDefaultBridgeParams', () => jest.fn(() => ({})));
jest.mock('./AndroidService/sendMessage', () =>
  jest.fn().mockResolvedValue(undefined),
);
jest.mock('../handlers/handleCustomRpcCalls', () =>
  jest.fn(async ({ rpc }: any) => rpc),
);
jest.mock('../../Permissions', () => ({
  getDefaultCaip25CaveatValue: jest.fn(() => ({})),
}));
jest.mock('../../../util/Logger');
jest.mock('../utils/DevLogger');

const VALID_ID = '3f1c2a4e-8b7d-4c1e-9a2b-5d6e7f8a9b0c';
const OTHER_ID = '7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d';

const sdk = SDKConnect.getInstance() as any;
const mockDispatch = store.dispatch as jest.Mock;
const mockRequestPermissions = jest.fn();
const mockHasPermission = jest.fn();

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const createService = async () => {
  const service = new AndroidService();
  await flush();
  return service;
};

const clientInfo = (clientId: string) =>
  JSON.stringify({
    clientId,
    originatorInfo: { url: 'https://dapp.example', title: 'Dapp' },
  });

const dispatchedTypes = () =>
  mockDispatch.mock.calls.map(([action]) => [action.type, action.channelId]);

describe('AndroidService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClientsConnected.length = 0;
    mockMessageReceived.length = 0;
    sdk.state.dappConnections = {};
    sdk.loadDappConnections.mockResolvedValue({});
    mockHasPermission.mockReturnValue(false);
    (Engine as any).context = {
      KeyringController: {},
      PermissionController: {
        requestPermissions: mockRequestPermissions,
        hasPermission: mockHasPermission,
      },
      AccountsController: {
        getSelectedAccount: () => ({ address: '0x1' }),
      },
      NetworkController: {
        state: { selectedNetworkClientId: 'mainnet' },
        getNetworkClientById: () => ({ configuration: { chainId: '0x1' } }),
      },
    };
  });

  describe('clients_connected', () => {
    it.each(['app.acmeswap.example', 'MetaMask Mobile', '', undefined])(
      'ignores non-UUID client id %p',
      async (clientId) => {
        const service = await createService();

        await mockClientsConnected[0](
          JSON.stringify({ clientId, originatorInfo: {} }),
        );
        await flush();

        expect(mockRequestPermissions).not.toHaveBeenCalled();
        expect(sdk.addDappConnection).not.toHaveBeenCalled();
        expect(sdk.state.dappConnections).toEqual({});
        expect(service.bridgeByClientId).toEqual({});
      },
    );

    it('does not persist a client before approval and discards it on rejection', async () => {
      let rejectPermission: (err: Error) => void = () => undefined;
      mockRequestPermissions.mockReturnValue(
        new Promise((_, reject) => {
          rejectPermission = reject;
        }),
      );
      const service = await createService();

      await mockClientsConnected[0](clientInfo(VALID_ID));
      await flush();

      expect(mockRequestPermissions).toHaveBeenCalledWith(
        { origin: VALID_ID },
        expect.anything(),
      );
      expect(sdk.addDappConnection).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
      expect(sdk.state.dappConnections[VALID_ID]).toMatchObject({
        origin: AppConstants.MM_SDK.ANDROID_SDK,
      });

      rejectPermission(new Error('User rejected the request.'));
      await flush();

      expect(sdk.addDappConnection).not.toHaveBeenCalled();
      expect(sdk.state.dappConnections[VALID_ID]).toBeUndefined();
      expect(dispatchedTypes()).toContainEqual([
        'REMOVE_DAPP_CONNECTION',
        VALID_ID,
      ]);
      expect(service.connections[VALID_ID]).toBeUndefined();
      expect(service.bridgeByClientId[VALID_ID]).toBeUndefined();
    });

    it('persists the client and creates a bridge after approval', async () => {
      mockRequestPermissions.mockResolvedValue([{}]);
      const service = await createService();
      const connected = jest.fn();
      service.on(EventType.CLIENTS_CONNECTED, connected);

      await mockClientsConnected[0](clientInfo(VALID_ID));
      await flush();

      expect(sdk.addDappConnection).toHaveBeenCalledTimes(1);
      expect(sdk.addDappConnection).toHaveBeenCalledWith(
        expect.objectContaining({
          id: VALID_ID,
          origin: AppConstants.MM_SDK.ANDROID_SDK,
        }),
      );
      expect(service.bridgeByClientId[VALID_ID]).toBeDefined();
      expect(service.connections[VALID_ID]).toMatchObject({ connected: true });
      expect(connected).toHaveBeenCalled();
    });
  });

  describe('restoring saved connections', () => {
    it('only rebuilds bridges for approved UUID clients', async () => {
      sdk.loadDappConnections.mockResolvedValue({
        [VALID_ID]: { id: VALID_ID, origin: 'AndroidSDK', originatorInfo: {} },
        [OTHER_ID]: { id: OTHER_ID, origin: 'AndroidSDK', originatorInfo: {} },
        'MetaMask Mobile': {
          id: 'MetaMask Mobile',
          origin: 'AndroidSDK',
          originatorInfo: {},
        },
      });
      mockHasPermission.mockImplementation((origin) => origin === VALID_ID);

      const service = await createService();

      expect(Object.keys(service.bridgeByClientId)).toEqual([VALID_ID]);
      expect(Object.keys(service.connections)).toEqual([VALID_ID]);
      expect(BackgroundBridge).toHaveBeenCalledTimes(1);
      expect(dispatchedTypes()).toEqual([
        ['REMOVE_DAPP_CONNECTION', OTHER_ID],
        ['REMOVE_DAPP_CONNECTION', 'MetaMask Mobile'],
      ]);
    });

    it('keeps saved clients when the permission state cannot be read', async () => {
      sdk.loadDappConnections.mockResolvedValue({
        [VALID_ID]: { id: VALID_ID, origin: 'AndroidSDK', originatorInfo: {} },
      });
      mockHasPermission.mockImplementation(() => {
        throw new Error('not ready');
      });

      const service = await createService();

      expect(service.bridgeByClientId).toEqual({});
      expect(BackgroundBridge).not.toHaveBeenCalled();
      expect(dispatchedTypes()).toEqual([]);
    });
  });

  describe('onMessageReceived', () => {
    it('ignores messages for non-UUID client ids', async () => {
      const service = await createService();

      mockMessageReceived[0](
        JSON.stringify({
          id: 'MetaMask Mobile',
          message: JSON.stringify({ id: '1', method: 'eth_accounts' }),
        }),
      );
      await flush();

      expect(mockRequestPermissions).not.toHaveBeenCalled();
      expect(BackgroundBridge).not.toHaveBeenCalled();
      expect(service.connections).toEqual({});
    });

    it('forgets an unknown client when the user rejects the permission prompt', async () => {
      mockRequestPermissions.mockRejectedValue(new Error('rejected'));
      const service = await createService();

      mockMessageReceived[0](
        JSON.stringify({
          id: VALID_ID,
          message: JSON.stringify({ id: '1', method: 'eth_accounts' }),
        }),
      );
      await flush();

      expect(mockRequestPermissions).toHaveBeenCalled();
      expect(service.connections[VALID_ID]).toBeUndefined();
      expect(service.bridgeByClientId[VALID_ID]).toBeUndefined();
    });
  });
});
