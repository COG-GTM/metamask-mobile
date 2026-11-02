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

import * as waitUtil from '../utils/wait.util';

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

describe('DeeplinkProtocolService', () => {
  let service: DeeplinkProtocolService;

  beforeEach(() => {
    jest.clearAllMocks();
    (SDKConnect.getInstance as jest.Mock).mockReturnValue({
      loadDappConnections: jest.fn().mockResolvedValue({
        connection1: {
          id: 'connection1',
          originatorInfo: { url: 'test.com', title: 'Test' },
          validUntil: Date.now() + 60_000,
          scheme: 'scheme1',
        },
      }),
      addDappConnection: jest.fn().mockResolvedValue(null),
      removeDappConnection: jest.fn().mockResolvedValue(null),
    });

    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Engine.context as any) = {
      PermissionController: {
        requestPermissions: jest.fn().mockResolvedValue(null),
        getPermissions: jest
          .fn()
          .mockReturnValue({ eth_accounts: { caveats: [{ value: [] }] } }),
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

    it('drops and removes expired stored connections', async () => {
      service = Object.create(DeeplinkProtocolService.prototype);
      service.connections = {};
      service.bridgeByClientId = {};
      service.isInitialized = false;
      (
        SDKConnect.getInstance().loadDappConnections as jest.Mock
      ).mockResolvedValue({
        expired: {
          id: 'expired',
          originatorInfo: { url: 'test.com', title: 'Test' },
          validUntil: Date.now() - 1,
          scheme: 'scheme1',
        },
      });

      await service.init();

      expect(service.connections.expired).toBeUndefined();
      expect(service.bridgeByClientId.expired).toBeUndefined();
      expect(
        SDKConnect.getInstance().removeDappConnection,
      ).toHaveBeenCalledWith('expired');
    });

    it('drops and removes stored connections without granted permissions', async () => {
      service = Object.create(DeeplinkProtocolService.prototype);
      service.connections = {};
      service.bridgeByClientId = {};
      service.isInitialized = false;
      (
        Engine.context.PermissionController.getPermissions as jest.Mock
      ).mockReturnValue(undefined);

      await service.init();

      expect(service.connections.connection1).toBeUndefined();
      expect(service.bridgeByClientId.connection1).toBeUndefined();
      expect(
        SDKConnect.getInstance().removeDappConnection,
      ).toHaveBeenCalledWith('connection1');
    });

    it('keeps stored connections without a bridge when permissions cannot be read', async () => {
      service = Object.create(DeeplinkProtocolService.prototype);
      service.connections = {};
      service.bridgeByClientId = {};
      service.isInitialized = false;
      (
        Engine.context.PermissionController.getPermissions as jest.Mock
      ).mockImplementation(() => {
        throw new Error('Engine not ready');
      });

      await service.init();

      expect(service.connections.connection1).toBeDefined();
      expect(service.bridgeByClientId.connection1).toBeUndefined();
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
      service.bridgeByClientId.channel1 = {
        onMessage: jest.fn(),
      } as unknown as BackgroundBridge;

      await service.handleConnection(connectionParams);

      expect(service.connections.channel1.connected).toBe(true);
    });

    it('re-prompts a restored session that has no bridge instead of forwarding its request', async () => {
      service.connections.channel1 = {
        clientId: 'channel1',
        originatorInfo: {
          url: 'test.com',
          title: 'Test',
          platform: 'test',
          dappId: 'dappId',
        },
        connected: false,
        validUntil: Date.now() + 60_000,
        scheme: 'scheme',
      };
      delete service.bridgeByClientId.channel1;
      const handleConnectionEventAsync = jest
        .spyOn(service, 'handleConnectionEventAsync')
        .mockResolvedValue(undefined);
      const processDappRpcRequest = jest
        .spyOn(service, 'processDappRpcRequest')
        .mockResolvedValue(undefined);

      await service.handleConnection({
        dappPublicKey: 'key',
        url: 'url',
        scheme: 'scheme',
        channelId: 'channel1',
        originatorInfo: Buffer.from(
          JSON.stringify({
            originatorInfo: { url: 'test.com', title: 'Test' },
          }),
        ).toString('base64'),
        request: JSON.stringify({ id: '1', method: 'eth_chainId' }),
      });

      expect(handleConnectionEventAsync).toHaveBeenCalled();
      expect(processDappRpcRequest).not.toHaveBeenCalled();
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
      const handleConnectionEventAsync = jest
        .spyOn(service, 'handleConnectionEventAsync')
        .mockResolvedValue(undefined);
      await service.handleConnection({
        dappPublicKey: 'key',
        url: 'url',
        scheme: 'scheme',
        channelId: 'new-channel',
        originatorInfo: Buffer.from(
          JSON.stringify({
            originatorInfo: { url: 'test.com', title: 'Test' },
          }),
        ).toString('base64'),
      });
      expect(handleConnectionEventAsync).toHaveBeenCalled();
      expect(SDKConnect.getInstance().addDappConnection).not.toHaveBeenCalled();
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

    it('removes the connection and never persists it when the user rejects', async () => {
      service.setupBridge = jest.requireActual(
        './DeeplinkProtocolService',
      ).default.prototype.setupBridge;
      service.dappPublicKeyByClientId[clientInfo.clientId] = 'key';
      Engine.context.PermissionController.getPermissions = jest
        .fn()
        .mockReturnValue(undefined);
      (service.checkPermission as jest.Mock).mockRejectedValue(
        new Error('User rejected the request.'),
      );

      await service.handleConnectionEventAsync({ clientInfo, params });

      expect(SDKConnect.getInstance().addDappConnection).not.toHaveBeenCalled();
      expect(
        SDKConnect.getInstance().removeDappConnection,
      ).toHaveBeenCalledWith(clientInfo.clientId);
      expect(service.connections[clientInfo.clientId]).toBeUndefined();
      expect(service.bridgeByClientId[clientInfo.clientId]).toBeUndefined();
      expect(
        service.dappPublicKeyByClientId[clientInfo.clientId],
      ).toBeUndefined();
    });

    it('keeps an approved connection when a later request fails', async () => {
      (service.processDappRpcRequest as jest.Mock).mockRejectedValue(
        new Error('rpc failure'),
      );

      await service.handleConnectionEventAsync({ clientInfo, params });

      expect(SDKConnect.getInstance().addDappConnection).toHaveBeenCalled();
      expect(
        SDKConnect.getInstance().removeDappConnection,
      ).not.toHaveBeenCalled();
      expect(service.connections[clientInfo.clientId]).toBeDefined();
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

  describe('handleMessage permission re-check', () => {
    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
    const messageParams = {
      dappPublicKey: 'key',
      url: 'url',
      message: Buffer.from(
        JSON.stringify({ id: '1', method: 'eth_chainId', params: [] }),
      ).toString('base64'),
      channelId: 'channel1',
      scheme: 'scheme',
      account: `${toChecksumHexAddress(MOCK_ADDRESS)}@1`,
    };
    let onMessage: jest.Mock;

    beforeEach(() => {
      onMessage = jest.fn();
      jest.spyOn(waitUtil, 'wait').mockResolvedValue(undefined as never);
      jest
        .spyOn(waitUtil, 'waitForKeychainUnlocked')
        .mockResolvedValue(true as never);
      service.getSelectedAddress = jest
        .fn()
        .mockReturnValue(toChecksumHexAddress(MOCK_ADDRESS));
      service.getChainId = jest.fn().mockReturnValue('1');
      service.connections.channel1 = {
        clientId: 'channel1',
        originatorInfo: {
          url: 'test.com',
          title: 'Test',
          platform: 'test',
          dappId: 'dappId',
        },
        connected: false,
        validUntil: Date.now() + 60_000,
        scheme: 'scheme',
      };
      service.bridgeByClientId.channel1 = {
        onMessage,
      } as unknown as BackgroundBridge;
      service.openDeeplink = jest.fn().mockResolvedValue(null);
      (handleCustomRpcCalls as jest.Mock).mockResolvedValue({
        id: '1',
        method: 'eth_chainId',
        params: [],
      });
    });

    it('forwards requests while permissions are granted', async () => {
      service.checkPermission = jest.fn();
      service.handleMessage(messageParams);
      await flush();
      expect(service.checkPermission).not.toHaveBeenCalled();
      expect(onMessage).toHaveBeenCalled();
    });

    it('drops the bridge and removes the session when permissions were revoked and the user rejects', async () => {
      (
        Engine.context.PermissionController.getPermissions as jest.Mock
      ).mockReturnValue(undefined);
      service.checkPermission = jest
        .fn()
        .mockRejectedValue(new Error('User rejected the request.'));

      service.handleMessage(messageParams);
      await flush();

      expect(service.checkPermission).toHaveBeenCalled();
      expect(onMessage).not.toHaveBeenCalled();
      expect(service.connections.channel1).toBeUndefined();
      expect(service.bridgeByClientId.channel1).toBeUndefined();
      expect(
        SDKConnect.getInstance().removeDappConnection,
      ).toHaveBeenCalledWith('channel1');
    });

    it('drops the bridge but keeps the session when permissions cannot be read', async () => {
      (
        Engine.context.PermissionController.getPermissions as jest.Mock
      ).mockImplementation(() => {
        throw new Error('controller unavailable');
      });
      service.checkPermission = jest
        .fn()
        .mockRejectedValue(new Error('controller unavailable'));

      service.handleMessage(messageParams);
      await flush();

      expect(onMessage).not.toHaveBeenCalled();
      expect(service.bridgeByClientId.channel1).toBeUndefined();
      expect(service.connections.channel1).toBeDefined();
      expect(
        SDKConnect.getInstance().removeDappConnection,
      ).not.toHaveBeenCalled();
    });
  });

  describe('transient permission controller failures', () => {
    it('keeps the stored session when the prompt fails and permissions cannot be read', async () => {
      service.checkPermission = jest
        .fn()
        .mockRejectedValue(new Error('controller unavailable'));
      service.openDeeplink = jest.fn().mockResolvedValue(null);
      jest.spyOn(waitUtil, 'wait').mockResolvedValue(undefined as never);
      jest
        .spyOn(waitUtil, 'waitForKeychainUnlocked')
        .mockResolvedValue(true as never);
      (
        Engine.context.PermissionController.getPermissions as jest.Mock
      ).mockImplementation(() => {
        throw new Error('controller unavailable');
      });

      await service.handleConnectionEventAsync({
        clientInfo: {
          clientId: 'channel1',
          originatorInfo: {
            url: 'test.com',
            title: 'Test',
            platform: 'test',
            dappId: 'dappId',
          },
          connected: false,
          validUntil: Date.now() + 60_000,
          scheme: 'scheme',
        },
        params: {
          dappPublicKey: 'key',
          url: 'url',
          scheme: 'scheme',
          channelId: 'channel1',
        },
      });

      expect(
        SDKConnect.getInstance().removeDappConnection,
      ).not.toHaveBeenCalled();
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

    it('removes the persisted dapp connection', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.connections.channel1 = {} as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.bridgeByClientId.channel1 = {} as any;
      service.removeConnection('channel1');
      expect(service.bridgeByClientId.channel1).toBeUndefined();
      expect(
        SDKConnect.getInstance().removeDappConnection,
      ).toHaveBeenCalledWith('channel1');
    });
  });
});
