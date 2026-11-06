/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Linking } from 'react-native';
import Engine from '../../../core/Engine';
import Logger from '../../../util/Logger';
import BackgroundBridge from '../../BackgroundBridge/BackgroundBridge';
import SDKConnect from '../SDKConnect';
import handleBatchRpcResponse from '../handlers/handleBatchRpcResponse';
import handleCustomRpcCalls from '../handlers/handleCustomRpcCalls';
import DevLogger from '../utils/DevLogger';
import DeeplinkProtocolService from './DeeplinkProtocolService';
import AppConstants from '../../AppConstants';
import { DappClient } from '../AndroidSDK/dapp-sdk-types';
import { createMockInternalAccount } from '../../../util/test/accountsControllerTestUtils';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { Caip25EndowmentPermissionName } from '@metamask/chain-agnostic-permission';

jest.mock('../SDKConnect');
jest.mock('react-native');
jest.mock('../../BackgroundBridge/BackgroundBridge');
jest.mock('../utils/DevLogger');
jest.mock('../../../util/Logger');
jest.mock('../handlers/handleCustomRpcCalls');
jest.mock('../handlers/handleBatchRpcResponse');
jest.mock('../../Permissions', () => ({
  ...jest.requireActual('../../Permissions'),
  getPermittedAccounts: jest.fn().mockReturnValue([]),
}));

const MOCK_ADDRESS = '0xc4955c0d639d99699bfd7ec54d9fafee40e4d272';
const mockInternalAccount = createMockInternalAccount(
  MOCK_ADDRESS,
  'Account 1',
);

const waitForAssertion = async (assertion: () => void, timeoutMs = 2000) => {
  const startedAt = Date.now();
  for (;;) {
    try {
      assertion();
      return;
    } catch (error) {
      if (Date.now() - startedAt > timeoutMs) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
};

describe('DeeplinkProtocolService', () => {
  let service: DeeplinkProtocolService;

  beforeEach(() => {
    jest.clearAllMocks();
    (SDKConnect.getInstance as jest.Mock).mockReturnValue({
      loadDappConnections: jest.fn().mockResolvedValue({
        connection1: {
          id: 'connection1',
          originatorInfo: { url: 'test.com', title: 'Test' },
          validUntil: Date.now(),
          scheme: 'scheme1',
        },
      }),
      addDappConnection: jest.fn().mockResolvedValue(null),
      removeDappConnection: jest.fn().mockResolvedValue(undefined),
      removeChannel: jest.fn().mockResolvedValue(true),
    });

    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Engine.context as any) = {
      PermissionController: {
        requestPermissions: jest.fn().mockResolvedValue(null),
        getPermissions: jest.fn().mockReturnValue({
          [Caip25EndowmentPermissionName]: { caveats: [{ value: {} }] },
        }),
      },
      KeyringController: { unlock: jest.fn() },
      NetworkController: {
        getNetworkClientById: () => ({
          configuration: {
            chainId: '0x1',
          },
        }),
      },
      AccountsController: {
        getSelectedAccount: jest.fn().mockReturnValue(mockInternalAccount),
      },
    };

    (Linking.openURL as jest.Mock).mockResolvedValue(null);
    service = new DeeplinkProtocolService();
  });

  describe('init', () => {
    it('should initialize and load connections', async () => {
      const spy = jest.spyOn(SDKConnect.getInstance(), 'loadDappConnections');
      await service.init();
      expect(spy).toHaveBeenCalled();
      expect(service.isInitialized).toBe(true);
    });

    it('should handle initialization error', async () => {
      (
        SDKConnect.getInstance().loadDappConnections as jest.Mock
      ).mockRejectedValue(new Error('Failed to load connections'));
      await service.init().catch(() => {
        expect(service.isInitialized).toBe(false);
        expect(Logger.log).toHaveBeenCalledWith(
          expect.any(Error),
          'DeeplinkProtocolService:: error initializing',
        );
      });
    });

    it('should initialize with raw connections', async () => {
      await service.init();
      expect(service.connections.connection1).toBeDefined();
    });

    it('does not restore persisted connections without a CAIP-25 permission', async () => {
      (
        Engine.context as unknown as {
          PermissionController: { getPermissions: jest.Mock };
        }
      ).PermissionController.getPermissions.mockReturnValue(undefined);

      const freshService = new DeeplinkProtocolService();
      await freshService.init();

      expect(freshService.connections.connection1).toBeUndefined();
      expect(freshService.bridgeByClientId.connection1).toBeUndefined();
      expect(
        SDKConnect.getInstance().removeDappConnection,
      ).toHaveBeenCalledWith('connection1');
    });

    it('does not restore persisted connections when permissions cannot be read', async () => {
      (
        Engine.context as unknown as {
          PermissionController: { getPermissions: jest.Mock };
        }
      ).PermissionController.getPermissions.mockImplementation(() => {
        throw new Error('not ready');
      });

      const freshService = new DeeplinkProtocolService();
      await freshService.init();

      expect(freshService.connections.connection1).toBeUndefined();
      expect(freshService.bridgeByClientId.connection1).toBeUndefined();
      expect(
        SDKConnect.getInstance().removeDappConnection,
      ).not.toHaveBeenCalled();
    });
  });

  describe('setupBridge', () => {
    it('should set up a bridge for the client', () => {
      const clientInfo = {
        clientId: 'client1',
        originatorInfo: {
          url: 'test.com',
          title: 'Test',
          platform: 'test',
          dappId: 'dappId',
        },
        connected: false,
        validUntil: Date.now(),
        scheme: 'test',
      };
      service.setupBridge(clientInfo);
      expect(service.bridgeByClientId[clientInfo.clientId]).toBeInstanceOf(
        BackgroundBridge,
      );
    });

    it('should return early if bridge already exists', () => {
      const clientInfo = {
        clientId: 'client1',
        originatorInfo: {
          url: 'test.com',
          title: 'Test',
          platform: 'test',
          dappId: 'dappId',
        },
        connected: false,
        validUntil: Date.now(),
        scheme: 'test',
      };
      service.bridgeByClientId.client1 = {} as BackgroundBridge;
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const setupBridgeSpy = jest.spyOn(service as any, 'setupBridge');
      service.setupBridge(clientInfo);
      expect(setupBridgeSpy).toHaveReturned();
    });
  });
  describe('sendMessage', () => {
    it('should handle sending messages correctly', async () => {
      service.rpcQueueManager.getId = jest.fn().mockReturnValue('rpcMethod');
      service.batchRPCManager.getById = jest.fn().mockReturnValue(null);
      service.rpcQueueManager.isEmpty = jest.fn().mockReturnValue(true);
      service.rpcQueueManager.remove = jest.fn(); // Mock the remove method

      await service.sendMessage({ data: { id: '1' } }, true);
      expect(service.rpcQueueManager.remove).toHaveBeenCalledWith('1');
    });

    it('should handle batch RPC responses', async () => {
      const mockChainRPCs = [{ id: '1' }];
      const mockMessage = {
        data: { id: '1', accounts: [], chainId: '0x1', error: null },
      };
      service.batchRPCManager.getById = jest
        .fn()
        .mockReturnValue(mockChainRPCs);
      (handleBatchRpcResponse as jest.Mock).mockResolvedValue(true);

      service.currentClientId = 'client1';
      service.bridgeByClientId.client1 = new BackgroundBridge({
        webview: null,
        channelId: 'client1',
        isMMSDK: true,
        url: 'test-url',
        isRemoteConn: true,
        sendMessage: jest.fn(),
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await service.sendMessage(mockMessage, true);
      expect(handleBatchRpcResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          chainRpcs: mockChainRPCs,
          msg: mockMessage,
          backgroundBridge: expect.any(BackgroundBridge),
          batchRPCManager: expect.anything(),
          sendMessage: expect.any(Function),
        }),
      );
    });

    it('should handle error in message data', async () => {
      const mockMessage = {
        data: {
          id: '1',
          accounts: [],
          chainId: '0x1',
          error: new Error('Test error'),
        },
      };
      const openDeeplinkSpy = jest.spyOn(service, 'openDeeplink');

      service.currentClientId = 'client1';
      service.bridgeByClientId.client1 = new BackgroundBridge({
        webview: null,
        channelId: 'client1',
        isMMSDK: true,
        url: 'test-url',
        isRemoteConn: true,
        sendMessage: jest.fn(),
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await service.sendMessage(mockMessage, true);
      expect(openDeeplinkSpy).toHaveBeenCalledWith({
        message: mockMessage,
        clientId: 'client1',
      });
    });

    it('should skip goBack if no rpc method and forceRedirect is not true', async () => {
      const mockMessage = { data: { id: '1' } };
      const devLoggerSpy = jest.spyOn(DevLogger, 'log');

      service.rpcQueueManager.getId = jest.fn().mockReturnValue(undefined);
      service.rpcQueueManager.isEmpty = jest.fn().mockReturnValue(true);

      await service.sendMessage(mockMessage);
      expect(devLoggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'no rpc method --- rpcMethod=undefined forceRedirect=undefined --- skip goBack()',
        ),
      );
    });

    it('should handle non-final batch RPC response and error in message data', async () => {
      const mockChainRPCs = [{ id: '1' }];
      const mockMessage = {
        data: {
          id: '1',
          accounts: [],
          chainId: '0x1',
          error: new Error('Test error'),
        },
      };
      const devLoggerSpy = jest.spyOn(DevLogger, 'log');
      const openDeeplinkSpy = jest.spyOn(service, 'openDeeplink');
      service.batchRPCManager.getById = jest
        .fn()
        .mockReturnValue(mockChainRPCs);
      (handleBatchRpcResponse as jest.Mock).mockResolvedValue(false);

      service.currentClientId = 'client1';
      service.bridgeByClientId.client1 = new BackgroundBridge({
        webview: null,
        channelId: 'client1',
        isMMSDK: true,
        url: 'test-url',
        isRemoteConn: true,
        sendMessage: jest.fn(),
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      service.rpcQueueManager.remove = jest.fn();

      await service.sendMessage(mockMessage, true);
      expect(devLoggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('NOT last rpc --- skip goBack()'),
        mockChainRPCs,
      );
      expect(service.rpcQueueManager.remove).toHaveBeenCalledWith('1');
      expect(openDeeplinkSpy).toHaveBeenCalledWith({
        message: mockMessage,
        clientId: 'client1',
      });
    });

    it('should update connection state and skip bridge setup if session exists', async () => {
      const connectionParams = {
        dappPublicKey: 'key',
        url: 'url',
        scheme: 'scheme',
        channelId: 'channel1',
        originatorInfo: Buffer.from(
          JSON.stringify({
            originatorInfo: {
              url: 'test.com',
              title: 'Test',
              platform: 'test',
              dappId: 'dappId',
            },
          }),
        ).toString('base64'),
      };
      service.connections.channel1 = {
        clientId: 'channel1',
        originatorInfo: {
          url: 'test.com',
          title: 'Test',
          platform: 'test',
          dappId: 'dappId',
        },
        connected: false,
        validUntil: Date.now(),
        scheme: 'scheme',
      };

      await service.handleConnection(connectionParams);

      expect(service.connections.channel1.connected).toBe(true);
    });
  });

  describe('openDeeplink', () => {
    it('should open a deeplink with the provided message', async () => {
      const spy = jest.spyOn(Linking, 'openURL');
      await service.openDeeplink({
        message: { test: 'test' },
        clientId: 'client1',
      });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('checkPermission', () => {
    it('should request permissions', async () => {
      const spy = jest.spyOn(
        Engine.context.PermissionController,
        'requestPermissions',
      );
      await service.checkPermission({
        channelId: 'channel1',
        originatorInfo: {
          url: 'test.com',
          title: 'Test',
          platform: 'test',
          dappId: 'dappId',
        },
      });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('handleConnection', () => {
    it('should handle a new connection', async () => {
      const connectionParams = {
        dappPublicKey: 'key',
        url: 'url',
        scheme: 'scheme',
        channelId: 'channel1',
        originatorInfo: Buffer.from(
          JSON.stringify({
            originatorInfo: { url: 'test.com', title: 'Test' },
          }),
        ).toString('base64'),
      };
      await service.handleConnection(connectionParams);
      expect(service.connections.connection1).toBeDefined();
    });

    it('does not persist a new connection before the user approves it', async () => {
      let resolvePermission: (value: unknown) => void = () => undefined;
      service.checkPermission = jest.fn().mockReturnValue(
        new Promise((resolve) => {
          resolvePermission = resolve;
        }),
      );
      service.sendMessage = jest.fn().mockResolvedValue(null);
      (Engine.context as unknown as Record<string, unknown>).KeyringController =
        { isUnlocked: jest.fn().mockReturnValue(true) };

      await service.handleConnection({
        dappPublicKey: 'key',
        url: 'url',
        scheme: 'scheme',
        channelId: 'pending-channel',
        originatorInfo: Buffer.from(
          JSON.stringify({
            originatorInfo: { url: 'test.com', title: 'Test' },
          }),
        ).toString('base64'),
      });

      await waitForAssertion(() =>
        expect(service.checkPermission).toHaveBeenCalled(),
      );
      expect(SDKConnect.getInstance().addDappConnection).not.toHaveBeenCalled();

      resolvePermission(null);

      await waitForAssertion(() =>
        expect(SDKConnect.getInstance().addDappConnection).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'pending-channel' }),
        ),
      );
    });
  });

  describe('rejected deeplink connection (persisted store round trip)', () => {
    const CHANNEL_ID = 'rejected-channel';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let persisted: Record<string, any>;
    let requestPermissions: jest.Mock;

    beforeEach(() => {
      persisted = {};
      requestPermissions = jest
        .fn()
        .mockRejectedValue(new Error('User rejected the request.'));

      (SDKConnect.getInstance as jest.Mock).mockReturnValue({
        loadDappConnections: jest.fn(async () => ({ ...persisted })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addDappConnection: jest.fn(async (connection: any) => {
          persisted[connection.id] = connection;
        }),
        removeDappConnection: jest.fn(async (channelId: string) => {
          delete persisted[channelId];
        }),
        removeChannel: jest.fn().mockResolvedValue(true),
      });

      (Engine.context as unknown) = {
        PermissionController: {
          requestPermissions,
          getPermissions: jest.fn().mockReturnValue(undefined),
        },
        KeyringController: { isUnlocked: jest.fn().mockReturnValue(true) },
        NetworkController: {
          state: { selectedNetworkClientId: 'mainnet' },
          getNetworkClientById: () => ({ configuration: { chainId: '0x1' } }),
        },
        AccountsController: {
          getSelectedAccount: jest.fn().mockReturnValue(mockInternalAccount),
        },
      };
    });

    it('is not restored as an existing session after an app restart', async () => {
      const firstRun = new DeeplinkProtocolService();
      await firstRun.init();

      await firstRun.handleConnection({
        dappPublicKey: 'attacker-key',
        url: 'https://attacker.example',
        scheme: 'attackerapp',
        channelId: CHANNEL_ID,
        originatorInfo: Buffer.from(
          JSON.stringify({
            originatorInfo: {
              url: 'https://uniswap.org',
              title: 'Uniswap',
              platform: 'ios',
              dappId: 'uniswap',
            },
          }),
        ).toString('base64'),
      });

      await waitForAssertion(() =>
        expect(Linking.openURL).toHaveBeenCalledWith(
          expect.stringMatching(/^attackerapp:\/\/mmsdk\?message=/),
        ),
      );
      expect(requestPermissions).toHaveBeenCalledTimes(1);
      expect(persisted[CHANNEL_ID]).toBeUndefined();
      expect(firstRun.connections[CHANNEL_ID]).toBeUndefined();
      expect(firstRun.dappPublicKeyByClientId[CHANNEL_ID]).toBeUndefined();

      // App restart
      (Linking.openURL as jest.Mock).mockClear();
      const secondRun = new DeeplinkProtocolService();
      await secondRun.init();

      expect(secondRun.connections[CHANNEL_ID]).toBeUndefined();
      expect(secondRun.bridgeByClientId[CHANNEL_ID]).toBeUndefined();

      secondRun.handleMessage({
        dappPublicKey: 'attacker-key',
        url: 'https://attacker.example',
        channelId: CHANNEL_ID,
        scheme: 'attackerapp',
        account: `${toChecksumHexAddress(MOCK_ADDRESS)}@0x1`,
        message: Buffer.from(
          JSON.stringify({ id: '42', method: 'eth_requestAccounts' }),
        ).toString('base64'),
      });

      await waitForAssertion(() =>
        expect(Linking.openURL).toHaveBeenCalledTimes(1),
      );
      const [deeplink] = (Linking.openURL as jest.Mock).mock.calls[0];
      const reply = JSON.parse(
        Buffer.from(
          new URL(deeplink).searchParams.get('message') as string,
          'base64',
        ).toString('utf-8'),
      );
      expect(reply.data.error).toEqual({
        code: 4100,
        message: 'Unauthorized request',
      });
      expect(handleCustomRpcCalls).not.toHaveBeenCalled();
    });
  });

  describe('handleConnectionEventAsync', () => {
    let clientInfo: DappClient;

    let params: {
      dappPublicKey: string;
      url: string;
      scheme: string;
      channelId: string;
      originatorInfo?: string;
      request?: string;
    };

    beforeEach(() => {
      clientInfo = {
        clientId: 'client1',
        originatorInfo: {
          url: 'test.com',
          title: 'Test',
          platform: 'test',
          dappId: 'dappId',
        },
        connected: false,
        validUntil: Date.now(),
        scheme: 'scheme1',
      };
      params = {
        dappPublicKey: 'key',
        url: 'url',
        scheme: 'scheme1',
        channelId: 'client1',
        originatorInfo: Buffer.from(
          JSON.stringify({
            originatorInfo: {
              url: 'test.com',
              title: 'Test',
              platform: 'test',
              dappId: 'dappId',
            },
          }),
        ).toString('base64'),
        request: JSON.stringify({ id: '1', method: 'test', params: [] }),
      };

      // Mocking methods
      service.checkPermission = jest.fn().mockResolvedValue(null);
      service.setupBridge = jest.fn();
      service.sendMessage = jest.fn().mockResolvedValue(null);
      service.processDappRpcRequest = jest.fn().mockResolvedValue(null);
      service.openDeeplink = jest.fn().mockResolvedValue(null);

      (Engine.context as unknown) = {
        PermissionController: {
          requestPermissions: jest.fn().mockResolvedValue(null),
        },
        KeyringController: {
          unlock: jest.fn().mockResolvedValue(null),
          isUnlocked: jest.fn().mockReturnValue(true),
        },
        PreferencesController: {
          state: {
            selectedAddress: '0xAddress',
          },
        },
      };
    });

    it('should setup a new client bridge if the connection does not exist', async () => {
      await service.handleConnectionEventAsync({ clientInfo, params });
      expect(service.checkPermission).toHaveBeenCalledWith({
        originatorInfo: clientInfo.originatorInfo,
        channelId: clientInfo.clientId,
      });
      expect(service.setupBridge).toHaveBeenCalledWith(clientInfo);
      expect(SDKConnect.getInstance().addDappConnection).toHaveBeenCalledWith({
        id: clientInfo.clientId,
        lastAuthorized: expect.any(Number),
        origin: AppConstants.MM_SDK.IOS_SDK,
        originatorInfo: clientInfo.originatorInfo,
        otherPublicKey: service.dappPublicKeyByClientId[clientInfo.clientId],
        validUntil: expect.any(Number),
        scheme: clientInfo.scheme,
      });
    });

    it('should update existing client connection and process request if exists', async () => {
      service.connections[clientInfo.clientId] = clientInfo;
      await service.handleConnectionEventAsync({ clientInfo, params });
      expect(service.processDappRpcRequest).toHaveBeenCalledWith(params);
    });

    it('should send error message if connection event fails', async () => {
      (service.checkPermission as jest.Mock).mockRejectedValue(
        new Error('Permission error'),
      );
      await service.handleConnectionEventAsync({ clientInfo, params });
      expect(service.sendMessage).toHaveBeenCalledWith({
        data: {
          error: new Error('Permission error'),
          jsonrpc: '2.0',
        },
        name: 'metamask-provider',
      });
      expect(service.openDeeplink).toHaveBeenCalledWith({
        message: {
          data: {
            error: new Error('Permission error'),
            jsonrpc: '2.0',
          },
          name: 'metamask-provider',
        },
        clientId: '',
        scheme: clientInfo.scheme,
      });
    });

    it('discards a new connection that the user rejected', async () => {
      service.dappPublicKeyByClientId[clientInfo.clientId] = 'key';
      (service.checkPermission as jest.Mock).mockRejectedValue(
        new Error('User rejected the request.'),
      );

      await service.handleConnectionEventAsync({ clientInfo, params });

      expect(service.setupBridge).not.toHaveBeenCalled();
      expect(SDKConnect.getInstance().addDappConnection).not.toHaveBeenCalled();
      expect(service.connections[clientInfo.clientId]).toBeUndefined();
      expect(
        service.dappPublicKeyByClientId[clientInfo.clientId],
      ).toBeUndefined();
      expect(
        SDKConnect.getInstance().removeDappConnection,
      ).toHaveBeenCalledWith(clientInfo.clientId);
      expect(SDKConnect.getInstance().removeChannel).toHaveBeenCalledWith({
        channelId: clientInfo.clientId,
        sendTerminate: false,
      });
    });

    it('discards a new connection whose bridge could not be created after approval', async () => {
      (service.setupBridge as jest.Mock).mockImplementation(() => {
        service.bridgeByClientId[clientInfo.clientId] =
          {} as unknown as BackgroundBridge;
        throw new Error('Connections from metamask origin are not allowed');
      });

      await service.handleConnectionEventAsync({ clientInfo, params });

      expect(SDKConnect.getInstance().addDappConnection).not.toHaveBeenCalled();
      expect(service.connections[clientInfo.clientId]).toBeUndefined();
      expect(service.bridgeByClientId[clientInfo.clientId]).toBeUndefined();
      expect(
        SDKConnect.getInstance().removeDappConnection,
      ).toHaveBeenCalledWith(clientInfo.clientId);
      expect(SDKConnect.getInstance().removeChannel).toHaveBeenCalledWith({
        channelId: clientInfo.clientId,
        sendTerminate: false,
      });
    });

    it('keeps an established connection when a later request fails', async () => {
      service.connections[clientInfo.clientId] = clientInfo;
      (service.processDappRpcRequest as jest.Mock).mockRejectedValue(
        new Error('Invalid origin'),
      );

      await service.handleConnectionEventAsync({ clientInfo, params });

      expect(service.connections[clientInfo.clientId]).toBeDefined();
      expect(SDKConnect.getInstance().removeChannel).not.toHaveBeenCalled();
      expect(
        SDKConnect.getInstance().removeDappConnection,
      ).not.toHaveBeenCalled();
    });
  });

  describe('processDappRpcRequest', () => {
    it('should process a dapp RPC request', async () => {
      const params = {
        dappPublicKey: 'key',
        url: 'url',
        scheme: 'scheme',
        channelId: 'channel1',
        originatorInfo: 'info',
        request: JSON.stringify({ id: '1', method: 'test', params: [] }),
      };
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.bridgeByClientId.channel1 = { onMessage: jest.fn() } as any;
      await service.processDappRpcRequest(params);
      expect(handleCustomRpcCalls).toHaveBeenCalled();
    });
  });

  describe('handleMessage', () => {
    it('should handle an incoming message', () => {
      const params = {
        dappPublicKey: 'key',
        url: 'url',
        message: Buffer.from(
          JSON.stringify({ id: '1', method: 'test', params: [] }),
        ).toString('base64'),
        channelId: 'channel1',
        scheme: 'scheme',
        account: `${toChecksumHexAddress(MOCK_ADDRESS)}@1`,
      };
      service.handleMessage(params);
      expect(DevLogger.log).toHaveBeenCalled();
    });
  });

  describe('removeConnection', () => {
    it('should remove a connection', () => {
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.connections.channel1 = {} as any;
      service.removeConnection('channel1');
      expect(service.connections.channel1).toBeUndefined();
    });
  });
});
