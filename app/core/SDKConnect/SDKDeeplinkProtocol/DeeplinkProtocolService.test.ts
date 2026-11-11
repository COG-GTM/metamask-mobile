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
import TransactionTypes from '../../TransactionTypes';
import { DappClient } from '../AndroidSDK/dapp-sdk-types';
import { createMockInternalAccount } from '../../../util/test/accountsControllerTestUtils';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { Caip25EndowmentPermissionName } from '@metamask/chain-agnostic-permission';
import { getPermittedAccounts } from '../../Permissions';

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

const CONNECTION_ID = '0d7b9a8e-1f2c-4e3d-8a5b-6c7d8e9f0a1b';
const CLIENT_ID = '1e8c0b9f-2a3d-4f4e-9b6c-7d8e9f0a1b2c';
const CHANNEL1_ID = '2f9d1c0a-3b4e-4a5f-8c7d-8e9f0a1b2c3d';
const PENDING_CHANNEL_ID = '3a0e2d1b-4c5f-4b6a-9d8e-9f0a1b2c3d4e';

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

const decodeOpenedDeeplinkMessages = () =>
  (Linking.openURL as jest.Mock).mock.calls.map(([deeplink]) =>
    JSON.parse(
      Buffer.from(
        new URL(deeplink).searchParams.get('message') as string,
        'base64',
      ).toString('utf-8'),
    ),
  );

describe('DeeplinkProtocolService', () => {
  let service: DeeplinkProtocolService;

  beforeEach(() => {
    jest.clearAllMocks();
    (SDKConnect.getInstance as jest.Mock).mockReturnValue({
      loadDappConnections: jest.fn().mockResolvedValue({
        [CONNECTION_ID]: {
          id: CONNECTION_ID,
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
      expect(service.connections[CONNECTION_ID]).toBeDefined();
    });

    it('does not restore persisted connections without a CAIP-25 permission', async () => {
      (
        Engine.context as unknown as {
          PermissionController: { getPermissions: jest.Mock };
        }
      ).PermissionController.getPermissions.mockReturnValue(undefined);

      const freshService = new DeeplinkProtocolService();
      await freshService.init();

      expect(freshService.connections[CONNECTION_ID]).toBeUndefined();
      expect(freshService.bridgeByClientId[CONNECTION_ID]).toBeUndefined();
      expect(
        SDKConnect.getInstance().removeDappConnection,
      ).toHaveBeenCalledWith(CONNECTION_ID);
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

      expect(freshService.connections[CONNECTION_ID]).toBeUndefined();
      expect(freshService.bridgeByClientId[CONNECTION_ID]).toBeUndefined();
      expect(
        SDKConnect.getInstance().removeDappConnection,
      ).not.toHaveBeenCalled();
    });
  });

  describe('setupBridge', () => {
    it('should set up a bridge for the client', () => {
      const clientInfo = {
        clientId: CLIENT_ID,
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
        clientId: CLIENT_ID,
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
      service.bridgeByClientId[CLIENT_ID] = {} as BackgroundBridge;
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

      service.currentClientId = CLIENT_ID;
      service.bridgeByClientId[CLIENT_ID] = new BackgroundBridge({
        webview: null,
        channelId: CLIENT_ID,
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

      service.currentClientId = CLIENT_ID;
      service.bridgeByClientId[CLIENT_ID] = new BackgroundBridge({
        webview: null,
        channelId: CLIENT_ID,
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
        clientId: CLIENT_ID,
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

      service.currentClientId = CLIENT_ID;
      service.bridgeByClientId[CLIENT_ID] = new BackgroundBridge({
        webview: null,
        channelId: CLIENT_ID,
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
        clientId: CLIENT_ID,
      });
    });

    it('should update connection state and skip bridge setup if session exists', async () => {
      const connectionParams = {
        dappPublicKey: 'key',
        url: 'url',
        scheme: 'scheme',
        channelId: CHANNEL1_ID,
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
      service.connections[CHANNEL1_ID] = {
        clientId: CHANNEL1_ID,
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

      expect(service.connections[CHANNEL1_ID].connected).toBe(true);
    });
  });

  describe('openDeeplink', () => {
    it('should open a deeplink with the provided message', async () => {
      const spy = jest.spyOn(Linking, 'openURL');
      await service.openDeeplink({
        message: { test: 'test' },
        clientId: CLIENT_ID,
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
        channelId: CHANNEL1_ID,
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
        channelId: CHANNEL1_ID,
        originatorInfo: Buffer.from(
          JSON.stringify({
            originatorInfo: { url: 'test.com', title: 'Test' },
          }),
        ).toString('base64'),
      };
      await service.handleConnection(connectionParams);
      expect(service.connections[CONNECTION_ID]).toBeDefined();
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
        channelId: PENDING_CHANNEL_ID,
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
          expect.objectContaining({ id: PENDING_CHANNEL_ID }),
        ),
      );
    });
  });

  describe('rejected deeplink connection (persisted store round trip)', () => {
    const CHANNEL_ID = '7f0f4d6e-3c1a-4b8e-9d2f-5a6b7c8d9e0f';
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

  describe('rejected deeplink connection re-opened after restart', () => {
    const CHANNEL_ID = '8a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let persisted: Record<string, any>;
    let requestPermissions: jest.Mock;
    let granted: Record<string, boolean>;

    const connectionParams = {
      dappPublicKey: 'attacker-key',
      url: 'https://attacker.example',
      scheme: 'attackerapp',
      channelId: CHANNEL_ID,
      originatorInfo: Buffer.from(
        JSON.stringify({
          originatorInfo: {
            url: 'https://attacker.example',
            title: 'Attacker',
            platform: 'ios',
            dappId: 'attacker',
          },
        }),
      ).toString('base64'),
    };

    beforeEach(() => {
      persisted = {};
      granted = {};
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
          getPermissions: jest.fn((origin: string) =>
            granted[origin]
              ? { [Caip25EndowmentPermissionName]: { caveats: [] } }
              : undefined,
          ),
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

      (getPermittedAccounts as jest.Mock).mockImplementation(
        (origin: string) => (granted[origin] ? [MOCK_ADDRESS] : []),
      );
    });

    afterEach(() => {
      (getPermittedAccounts as jest.Mock).mockReset().mockReturnValue([]);
    });

    it('asks for approval again and sends no accounts to the dapp', async () => {
      const firstRun = new DeeplinkProtocolService();
      await firstRun.init();
      await firstRun.handleConnection(connectionParams);

      await waitForAssertion(() =>
        expect(Linking.openURL).toHaveBeenCalledTimes(1),
      );
      expect(requestPermissions).toHaveBeenCalledTimes(1);

      // App restart
      const secondRun = new DeeplinkProtocolService();
      await secondRun.init();
      await secondRun.handleConnection(connectionParams);

      await waitForAssertion(() =>
        expect(Linking.openURL).toHaveBeenCalledTimes(2),
      );
      expect(requestPermissions).toHaveBeenCalledTimes(2);
      expect(persisted[CHANNEL_ID]).toBeUndefined();

      for (const message of decodeOpenedDeeplinkMessages()) {
        expect(message.data.accounts ?? []).toEqual([]);
        expect(message.data.error).toBeDefined();
      }
    });
  });

  describe('internal-origin channelId', () => {
    const INTERNAL_ORIGIN = TransactionTypes.MMM;

    beforeEach(() => {
      (getPermittedAccounts as jest.Mock).mockImplementation(
        (origin: string) => (origin === INTERNAL_ORIGIN ? [MOCK_ADDRESS] : []),
      );
      (Engine.context as unknown as Record<string, unknown>).KeyringController =
        { isUnlocked: jest.fn().mockReturnValue(true) };
    });

    afterEach(() => {
      (getPermittedAccounts as jest.Mock).mockReset().mockReturnValue([]);
    });

    it('rejects a connection whose channelId is not a UUID', async () => {
      await service.init();
      (Linking.openURL as jest.Mock).mockClear();

      await service.handleConnection({
        dappPublicKey: 'attacker-key',
        url: 'https://attacker.example',
        scheme: 'attackerapp',
        channelId: INTERNAL_ORIGIN,
        originatorInfo: Buffer.from(
          JSON.stringify({
            originatorInfo: { url: 'https://attacker.example', title: 'A' },
          }),
        ).toString('base64'),
      });
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(INTERNAL_ORIGIN).toBe('MetaMask Mobile');
      expect(
        Engine.context.PermissionController.requestPermissions,
      ).not.toHaveBeenCalled();
      expect(SDKConnect.getInstance().addDappConnection).not.toHaveBeenCalled();
      expect(service.connections[INTERNAL_ORIGIN]).toBeUndefined();
      expect(service.dappPublicKeyByClientId[INTERNAL_ORIGIN]).toBeUndefined();
      expect(service.currentClientId).not.toBe(INTERNAL_ORIGIN);
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it('rejects a message whose channelId is not a UUID', async () => {
      service.connections[INTERNAL_ORIGIN] = {
        clientId: INTERNAL_ORIGIN,
        originatorInfo: { url: 'x', title: 'x', platform: 'ios', dappId: 'x' },
        connected: false,
        validUntil: Date.now() + 60_000,
        scheme: 'attackerapp',
      };
      (Linking.openURL as jest.Mock).mockClear();

      service.handleMessage({
        dappPublicKey: 'attacker-key',
        url: 'https://attacker.example',
        channelId: INTERNAL_ORIGIN,
        scheme: 'attackerapp',
        account: `${toChecksumHexAddress(MOCK_ADDRESS)}@0x1`,
        message: Buffer.from(
          JSON.stringify({ id: '1', method: 'eth_accounts' }),
        ).toString('base64'),
      });
      await new Promise((resolve) => setTimeout(resolve, 400));

      expect(handleCustomRpcCalls).not.toHaveBeenCalled();
      expect(Linking.openURL).not.toHaveBeenCalled();
      expect(service.currentClientId).not.toBe(INTERNAL_ORIGIN);
    });

    it('does not restore a persisted connection whose channelId is not a UUID', async () => {
      (
        SDKConnect.getInstance().loadDappConnections as jest.Mock
      ).mockResolvedValue({
        [INTERNAL_ORIGIN]: {
          id: INTERNAL_ORIGIN,
          originatorInfo: { url: 'x', title: 'x' },
          validUntil: Date.now() + 60_000,
          scheme: 'attackerapp',
        },
      });

      const freshService = new DeeplinkProtocolService();
      await freshService.init();

      expect(freshService.connections[INTERNAL_ORIGIN]).toBeUndefined();
      expect(freshService.bridgeByClientId[INTERNAL_ORIGIN]).toBeUndefined();
      expect(
        SDKConnect.getInstance().removeDappConnection,
      ).toHaveBeenCalledWith(INTERNAL_ORIGIN);
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
        clientId: CLIENT_ID,
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
        channelId: CLIENT_ID,
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
        channelId: CHANNEL1_ID,
        originatorInfo: 'info',
        request: JSON.stringify({ id: '1', method: 'test', params: [] }),
      };
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.bridgeByClientId[CHANNEL1_ID] = { onMessage: jest.fn() } as any;
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
        channelId: CHANNEL1_ID,
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
      service.connections[CHANNEL1_ID] = {} as any;
      service.removeConnection(CHANNEL1_ID);
      expect(service.connections[CHANNEL1_ID]).toBeUndefined();
    });
  });
});
