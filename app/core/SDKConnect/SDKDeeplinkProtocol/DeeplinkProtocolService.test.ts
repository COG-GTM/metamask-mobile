/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Linking } from 'react-native';
import Engine from '../../../core/Engine';
import Logger from '../../../util/Logger';
import BackgroundBridge from '../../BackgroundBridge/BackgroundBridge';
import SDKConnect from '../SDKConnect';
import handleBatchRpcResponse from '../handlers/handleBatchRpcResponse';
import handleCustomRpcCalls from '../handlers/handleCustomRpcCalls';
import DevLogger from '../utils/DevLogger';
import DeeplinkProtocolService, {
  isValidDappScheme,
} from './DeeplinkProtocolService';
import { getPermittedAccounts } from '../../Permissions';
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

      await service.sendMessage({ data: { id: '1' } }, 'client1', true);
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

      await service.sendMessage(mockMessage, 'client1', true);
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

      await service.sendMessage(mockMessage, 'client1', true);
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

      await service.sendMessage(mockMessage, 'client1');
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

      await service.sendMessage(mockMessage, 'client1', true);
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
        scheme: 'testscheme',
      });
      expect(spy).toHaveBeenCalledWith(
        expect.stringMatching(/^testscheme:\/\/mmsdk\?message=/),
      );
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
      expect(service.sendMessage).toHaveBeenCalledWith(
        {
          data: {
            error: new Error('Permission error'),
            jsonrpc: '2.0',
          },
          name: 'metamask-provider',
        },
        clientInfo.clientId,
      );
      expect(service.openDeeplink).toHaveBeenCalledWith({
        message: {
          data: {
            error: new Error('Permission error'),
            jsonrpc: '2.0',
          },
          name: 'metamask-provider',
        },
        clientId: clientInfo.clientId,
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

  describe('removeConnection', () => {
    it('should remove a connection', () => {
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.connections.channel1 = {} as any;
      service.removeConnection('channel1');
      expect(service.connections.channel1).toBeUndefined();
    });
  });

  describe('per-client response routing', () => {
    const originatorInfo = {
      url: 'test.com',
      title: 'Test',
      platform: 'test',
      dappId: 'dappId',
    };
    const ACCOUNT_A = toChecksumHexAddress(MOCK_ADDRESS);
    const ACCOUNT_B = '0x0000000000000000000000000000000000000b0b';

    const flushUntil = async (predicate: () => boolean) => {
      for (let i = 0; i < 100 && !predicate(); i++) {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      expect(predicate()).toBe(true);
    };

    const bridgeSendMessage = (channelId: string) => {
      const call = (BackgroundBridge as unknown as jest.Mock).mock.calls.find(
        ([args]) => args.channelId === channelId,
      );
      return call[0].sendMessage as (msg: unknown) => Promise<void>;
    };

    const decodeDeeplink = (url: string) =>
      JSON.parse(
        Buffer.from(url.split('message=')[1], 'base64').toString('utf-8'),
      );

    const deeplinkMessage = (
      channelId: string,
      id: string,
      method: string,
    ) => ({
      dappPublicKey: 'key',
      url: 'url',
      channelId,
      scheme: channelId === 'channelA' ? 'acme' : 'mallory',
      account: `${ACCOUNT_A}@0x1`,
      message: Buffer.from(JSON.stringify({ id, method, params: [] })).toString(
        'base64',
      ),
    });

    beforeEach(() => {
      (
        Engine.context as unknown as {
          KeyringController: { isUnlocked: () => boolean };
        }
      ).KeyringController.isUnlocked = jest.fn().mockReturnValue(true);
      (handleCustomRpcCalls as jest.Mock).mockImplementation(
        async ({ rpc }) => rpc,
      );
      (getPermittedAccounts as jest.Mock).mockImplementation((origin) =>
        origin === 'channelA' ? [ACCOUNT_A] : [ACCOUNT_B],
      );

      service.connections.channelA = {
        clientId: 'channelA',
        originatorInfo,
        connected: false,
        validUntil: Date.now(),
        scheme: 'acme',
      };
      service.connections.channelB = {
        clientId: 'channelB',
        originatorInfo,
        connected: false,
        validUntil: Date.now(),
        scheme: 'mallory',
      };
      service.setupBridge(service.connections.channelA);
      service.setupBridge(service.connections.channelB);
      service.bridgeByClientId.channelA.onMessage = jest.fn();
      service.bridgeByClientId.channelB.onMessage = jest.fn();
    });

    afterEach(() => {
      (getPermittedAccounts as jest.Mock).mockReturnValue([]);
    });

    it('delivers a response to the requesting client even if another client sent a deeplink afterwards', async () => {
      const bridgeA = service.bridgeByClientId.channelA;
      const bridgeB = service.bridgeByClientId.channelB;

      service.handleMessage(deeplinkMessage('channelA', '1', 'personal_sign'));
      await flushUntil(
        () => (bridgeA.onMessage as jest.Mock).mock.calls.length > 0,
      );

      service.handleMessage(deeplinkMessage('channelB', '2', 'eth_chainId'));
      await flushUntil(
        () => (bridgeB.onMessage as jest.Mock).mock.calls.length > 0,
      );

      await bridgeSendMessage('channelB')({
        name: 'metamask-provider',
        data: { id: '2', jsonrpc: '2.0', result: '0x1' },
      });
      await bridgeSendMessage('channelA')({
        name: 'metamask-provider',
        data: { id: '1', jsonrpc: '2.0', result: '0xsignature' },
      });

      const urls = (Linking.openURL as jest.Mock).mock.calls.map(([u]) => u);
      const responseA = urls.find(
        (u: string) => decodeDeeplink(u).data.id === '1',
      );
      expect(responseA.startsWith('acme://mmsdk?message=')).toBe(true);
      expect(decodeDeeplink(responseA).data).toMatchObject({
        result: '0xsignature',
        accounts: [ACCOUNT_A],
      });
      expect(
        urls
          .filter((u: string) => u.startsWith('mallory://'))
          .map(decodeDeeplink),
      ).not.toContainEqual(
        expect.objectContaining({
          data: expect.objectContaining({ result: '0xsignature' }),
        }),
      );
    });

    it('binds batch responses to the requesting client bridge', async () => {
      service.batchRPCManager.getById = jest
        .fn()
        .mockReturnValue([{ id: '1' }]);
      (handleBatchRpcResponse as jest.Mock).mockResolvedValue(true);

      await bridgeSendMessage('channelA')({
        name: 'metamask-provider',
        data: { id: '1', result: [] },
      });

      expect(handleBatchRpcResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          backgroundBridge: service.bridgeByClientId.channelA,
        }),
      );
      expect(getPermittedAccounts).toHaveBeenCalledWith('channelA');
      expect(getPermittedAccounts).not.toHaveBeenCalledWith('channelB');
    });
  });

  describe('scheme validation', () => {
    it.each(['acme', 'com.acme.app', 'my-app+v2', 'Acme1'])(
      'accepts custom scheme %s',
      (scheme) => {
        expect(isValidDappScheme(scheme)).toBe(true);
      },
    );

    it.each([
      'https',
      'HTTP',
      'metamask',
      'javascript',
      'https://evil.example/?x=',
      'evil://x',
      'a b',
      '1abc',
      '',
      'a'.repeat(65),
      undefined,
    ])('rejects scheme %s', (scheme) => {
      expect(isValidDappScheme(scheme)).toBe(false);
    });

    it('does not open a deeplink for a stored web scheme', async () => {
      service.connections.evil = {
        clientId: 'evil',
        originatorInfo: { url: 'e', title: 'e', platform: 'e', dappId: 'e' },
        connected: true,
        validUntil: Date.now(),
        scheme: 'https://evil.example/?x=',
      };

      await service.openDeeplink({ message: { a: 1 }, clientId: 'evil' });
      await service.openDeeplink({
        message: { a: 1 },
        clientId: 'unknown',
        scheme: 'https',
      });

      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it('rejects a connection with an invalid scheme without persisting it', async () => {
      const handleConnectionEventSpy = jest.spyOn(
        service,
        'handleConnectionEventAsync',
      );

      await service.handleConnection({
        dappPublicKey: 'key',
        url: 'url',
        scheme: 'https://evil.example/?x=',
        channelId: 'evil',
        originatorInfo: Buffer.from(
          JSON.stringify({ originatorInfo: { url: 'e', title: 'e' } }),
        ).toString('base64'),
      });

      expect(handleConnectionEventSpy).not.toHaveBeenCalled();
      expect(SDKConnect.getInstance().addDappConnection).not.toHaveBeenCalled();
      expect(service.connections.evil).toBeUndefined();
      expect(Linking.openURL).not.toHaveBeenCalled();
    });
  });

  describe('connection persistence', () => {
    const connectParams = {
      dappPublicKey: 'key',
      url: 'url',
      scheme: 'acme',
      channelId: 'newClient',
      originatorInfo: Buffer.from(
        JSON.stringify({ originatorInfo: { url: 'acme.com', title: 'Acme' } }),
      ).toString('base64'),
    };

    beforeEach(() => {
      (
        Engine.context as unknown as {
          KeyringController: { isUnlocked: () => boolean };
        }
      ).KeyringController.isUnlocked = jest.fn().mockReturnValue(true);
    });

    it('persists a new connection only after the user approves it', async () => {
      let approve: (value: unknown) => void = () => undefined;
      service.checkPermission = jest.fn().mockReturnValue(
        new Promise((resolve) => {
          approve = resolve;
        }),
      );

      await service.handleConnection(connectParams);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(service.checkPermission).toHaveBeenCalled();
      expect(SDKConnect.getInstance().addDappConnection).not.toHaveBeenCalled();
      expect(service.connections.newClient).toBeUndefined();

      approve(null);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(SDKConnect.getInstance().addDappConnection).toHaveBeenCalledTimes(
        1,
      );
      expect(SDKConnect.getInstance().addDappConnection).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'newClient', scheme: 'acme' }),
      );
      expect(service.connections.newClient).toBeDefined();
    });

    it('does not persist a connection the user rejects', async () => {
      service.checkPermission = jest
        .fn()
        .mockRejectedValue(new Error('User rejected the request.'));

      await service.handleConnection(connectParams);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(SDKConnect.getInstance().addDappConnection).not.toHaveBeenCalled();
      expect(service.connections.newClient).toBeUndefined();
      expect(service.bridgeByClientId.newClient).toBeUndefined();
      const urls = (Linking.openURL as jest.Mock).mock.calls.map(([u]) => u);
      expect(urls).toHaveLength(1);
      expect(urls[0].startsWith('acme://mmsdk?message=')).toBe(true);
    });
  });
});
