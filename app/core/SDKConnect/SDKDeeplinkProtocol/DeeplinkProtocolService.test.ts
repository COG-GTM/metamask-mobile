/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Linking } from 'react-native';
import Engine from '../../../core/Engine';
import Logger from '../../../util/Logger';
import BackgroundBridge from '../../BackgroundBridge/BackgroundBridge';
import SDKConnect from '../SDKConnect';
import handleBatchRpcResponse from '../handlers/handleBatchRpcResponse';
import handleCustomRpcCalls from '../handlers/handleCustomRpcCalls';
import DevLogger from '../utils/DevLogger';
import { wait, waitForKeychainUnlocked } from '../utils/wait.util';
import DeeplinkProtocolService from './DeeplinkProtocolService';
import AppConstants from '../../AppConstants';
import { DappClient } from '../AndroidSDK/dapp-sdk-types';
import { createMockInternalAccount } from '../../../util/test/accountsControllerTestUtils';
import { toChecksumHexAddress } from '@metamask/controller-utils';

jest.mock('../SDKConnect');
jest.mock('react-native');
jest.mock('../../BackgroundBridge/BackgroundBridge');
jest.mock('../utils/DevLogger');
jest.mock('../../../util/Logger');
jest.mock('../handlers/handleCustomRpcCalls');
jest.mock('../handlers/handleBatchRpcResponse');
jest.mock('../utils/wait.util', () => {
  const actual = jest.requireActual('../utils/wait.util');
  return {
    ...actual,
    wait: jest.fn(actual.wait),
    waitForKeychainUnlocked: jest.fn(actual.waitForKeychainUnlocked),
  };
});
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
          validUntil: Date.now(),
          scheme: 'scheme1',
        },
      }),
      addDappConnection: jest.fn().mockResolvedValue(null),
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

    it('restores the dapp public key bound to each stored session', async () => {
      (
        SDKConnect.getInstance().loadDappConnections as jest.Mock
      ).mockResolvedValue({
        connection1: {
          id: 'connection1',
          originatorInfo: { url: 'test.com', title: 'Test' },
          validUntil: Date.now() + 60_000,
          scheme: 'scheme1',
          otherPublicKey: 'stored-key',
        },
      });

      service.isInitialized = false;
      await service.init();

      expect(service.dappPublicKeyByClientId.connection1).toBe('stored-key');
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
        validUntil: Date.now() + 60_000,
        scheme: 'scheme',
      };
      service.dappPublicKeyByClientId.channel1 = 'key';

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
  });

  describe('handleConnection on an existing session', () => {
    const originatorInfo = Buffer.from(
      JSON.stringify({
        originatorInfo: { url: 'mallory.example', title: 'Mallory' },
      }),
    ).toString('base64');
    const request = JSON.stringify({
      id: '1',
      method: 'eth_sendTransaction',
      params: [],
    });
    let onMessage: jest.Mock;

    const flush = () => new Promise((resolve) => setImmediate(resolve));

    beforeEach(() => {
      onMessage = jest.fn();
      service.connections.acme = {
        clientId: 'acme',
        originatorInfo: {
          url: 'acme.example',
          title: 'Acme Swap',
          platform: 'ios',
          dappId: 'acme',
        },
        connected: false,
        validUntil: Date.now() + 60_000,
        scheme: 'acmeswap',
      };
      service.dappPublicKeyByClientId.acme = 'acme-key';
      service.bridgeByClientId.acme = {
        onMessage,
      } as unknown as BackgroundBridge;
      (handleCustomRpcCalls as jest.Mock).mockImplementation(
        async ({ rpc }) => rpc,
      );
      (
        Engine.context as unknown as {
          KeyringController: { isUnlocked: () => boolean };
        }
      ).KeyringController.isUnlocked = () => true;
    });

    it('does not run a request or replace the key when the public key differs', async () => {
      (
        Engine.context.PermissionController.requestPermissions as jest.Mock
      ).mockRejectedValue(new Error('User rejected'));

      await service.handleConnection({
        channelId: 'acme',
        url: 'url',
        scheme: 'acmeswap',
        dappPublicKey: 'mallory-key',
        originatorInfo,
        request,
      });
      await flush();

      expect(onMessage).not.toHaveBeenCalled();
      expect(service.dappPublicKeyByClientId.acme).toBe('acme-key');
      expect(service.connections.acme.scheme).toBe('acmeswap');
      expect(service.connections.acme.originatorInfo.title).toBe('Acme Swap');
      expect(
        Engine.context.PermissionController.requestPermissions,
      ).toHaveBeenCalledWith({ origin: 'acme' }, expect.any(Object));
      expect(SDKConnect.getInstance().addDappConnection).not.toHaveBeenCalled();
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it('does not run a request when the return scheme differs', async () => {
      (
        Engine.context.PermissionController.requestPermissions as jest.Mock
      ).mockRejectedValue(new Error('User rejected'));

      await service.handleConnection({
        channelId: 'acme',
        url: 'url',
        scheme: 'mallory',
        dappPublicKey: 'acme-key',
        originatorInfo,
        request,
      });
      await flush();

      expect(onMessage).not.toHaveBeenCalled();
      expect(service.connections.acme.scheme).toBe('acmeswap');
    });

    it('requires re-approval when the session has expired', async () => {
      service.connections.acme.validUntil = Date.now() - 1;
      (
        Engine.context.PermissionController.requestPermissions as jest.Mock
      ).mockRejectedValue(new Error('User rejected'));

      await service.handleConnection({
        channelId: 'acme',
        url: 'url',
        scheme: 'acmeswap',
        dappPublicKey: 'acme-key',
        originatorInfo,
        request,
      });
      await flush();

      expect(onMessage).not.toHaveBeenCalled();
      expect(
        Engine.context.PermissionController.requestPermissions,
      ).toHaveBeenCalled();
    });

    it('rebinds the session and runs the request once the user re-approves', async () => {
      await service.handleConnection({
        channelId: 'acme',
        url: 'url',
        scheme: 'acmeswap',
        dappPublicKey: 'rotated-key',
        originatorInfo,
        request,
      });
      await flush();

      expect(service.dappPublicKeyByClientId.acme).toBe('rotated-key');
      expect(SDKConnect.getInstance().addDappConnection).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'acme',
          otherPublicKey: 'rotated-key',
          scheme: 'acmeswap',
        }),
      );
      expect(onMessage).toHaveBeenCalledWith({
        name: 'metamask-provider',
        data: expect.objectContaining({ method: 'eth_sendTransaction' }),
      });
    });

    it('runs the request without a prompt when key, scheme and expiry match', async () => {
      await service.handleConnection({
        channelId: 'acme',
        url: 'url',
        scheme: 'acmeswap',
        dappPublicKey: 'acme-key',
        originatorInfo,
        request,
      });

      expect(onMessage).toHaveBeenCalledTimes(1);
      expect(
        Engine.context.PermissionController.requestPermissions,
      ).not.toHaveBeenCalled();
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

  describe('handleMessage on an existing session', () => {
    let onMessage: jest.Mock;
    const message = Buffer.from(
      JSON.stringify({ id: '1', method: 'personal_sign', params: [] }),
    ).toString('base64');
    const account = `${toChecksumHexAddress(MOCK_ADDRESS)}@0x1`;

    beforeEach(() => {
      (wait as jest.Mock).mockResolvedValueOnce(undefined);
      (waitForKeychainUnlocked as jest.Mock).mockResolvedValueOnce(true);
      onMessage = jest.fn();
      service.connections.acme = {
        clientId: 'acme',
        originatorInfo: {
          url: 'acme.example',
          title: 'Acme Swap',
          platform: 'ios',
          dappId: 'acme',
        },
        connected: false,
        validUntil: Date.now() + 60_000,
        scheme: 'acmeswap',
      };
      service.dappPublicKeyByClientId.acme = 'acme-key';
      service.bridgeByClientId.acme = {
        onMessage,
      } as unknown as BackgroundBridge;
      (handleCustomRpcCalls as jest.Mock).mockImplementation(
        async ({ rpc }) => rpc,
      );
    });

    const send = async (overrides: {
      dappPublicKey?: string;
      scheme?: string;
    }) => {
      service.handleMessage({
        channelId: 'acme',
        url: 'url',
        message,
        account,
        dappPublicKey: 'acme-key',
        scheme: 'acmeswap',
        ...overrides,
      } as Parameters<DeeplinkProtocolService['handleMessage']>[0]);
      await new Promise((resolve) => setTimeout(resolve, 0));
    };

    it('forwards messages from the bound dapp', async () => {
      await send({});
      expect(onMessage).toHaveBeenCalledTimes(1);
    });

    it('drops messages carrying a different public key', async () => {
      await send({ dappPublicKey: 'mallory-key' });
      expect(onMessage).not.toHaveBeenCalled();
    });

    it('drops messages with a different scheme without opening it', async () => {
      await send({ scheme: 'mallory' });
      expect(onMessage).not.toHaveBeenCalled();
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it('rejects messages on an expired session', async () => {
      service.connections.acme.validUntil = Date.now() - 1;
      await send({});
      expect(onMessage).not.toHaveBeenCalled();
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringMatching(/^acmeswap:\/\/mmsdk\?message=/),
      );
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
