/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventType } from '@metamask/sdk-communication-layer';
import { NativeModules } from 'react-native';
import Engine from '../../Engine';
import BackgroundBridge from '../../BackgroundBridge/BackgroundBridge';
import SDKConnect from '../SDKConnect';
import handleCustomRpcCalls from '../handlers/handleCustomRpcCalls';
import DevLogger from '../utils/DevLogger';
import Logger from '../../../util/Logger';
import AndroidService from './AndroidService';
import { createMockInternalAccount } from '../../../util/test/accountsControllerTestUtils';

const mockEventListeners: { [key: string]: (data: string) => void } = {};

jest.mock('../SDKConnect');
jest.mock('react-native', () => {
  const listeners: { [key: string]: (data: string) => void } = {};
  return {
    NativeModules: {
      CommunicationClient: {
        sendMessage: jest.fn(),
      },
      RCTDeviceEventEmitter: {
        addListener: jest.fn(),
        removeListeners: jest.fn(),
      },
    },
    NativeEventEmitter: jest.fn().mockImplementation(() => ({
      addListener: jest.fn((event: string, callback: (data: string) => void) => {
        listeners[event] = callback;
        mockEventListeners[event] = callback;
        return { remove: jest.fn() };
      }),
      removeAllListeners: jest.fn(),
    })),
  };
});
jest.mock('../../BackgroundBridge/BackgroundBridge');
jest.mock('../utils/DevLogger');
jest.mock('../../../util/Logger');
jest.mock('../handlers/handleCustomRpcCalls');
jest.mock('../../Permissions', () => ({
  ...jest.requireActual('../../Permissions'),
  getPermittedAccounts: jest.fn().mockReturnValue([]),
  getDefaultCaip25CaveatValue: jest.fn().mockReturnValue({}),
}));

const mockEventListeners: { [key: string]: (data: string) => void } = {};

const MOCK_ADDRESS = '0xc4955c0d639d99699bfd7ec54d9fafee40e4d272';
const mockInternalAccount = createMockInternalAccount(MOCK_ADDRESS, 'Account 1');

const mockKeyringController = {
  isUnlocked: jest.fn().mockReturnValue(true),
  unlock: jest.fn(),
};

const mockPermissionController = {
  requestPermissions: jest.fn().mockResolvedValue(null),
  getPermissions: jest.fn().mockReturnValue({
    eth_accounts: { caveats: [{ value: [] }] },
  }),
};

const mockNetworkController = {
  getNetworkClientById: jest.fn().mockReturnValue({
    configuration: { chainId: '0x1' },
  }),
  state: { selectedNetworkClientId: 'mainnet' },
};

const mockAccountsController = {
  getSelectedAccount: jest.fn().mockReturnValue(mockInternalAccount),
};

const mockSDKConnectInstance = {
  loadDappConnections: jest.fn().mockResolvedValue(null),
  addDappConnection: jest.fn().mockResolvedValue(null),
  bindAndroidSDK: jest.fn().mockResolvedValue(null),
  isAndroidSDKBound: jest.fn().mockReturnValue(true),
  state: { navigation: null },
};

describe('AndroidService Integration Tests', () => {
  let service: AndroidService;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockEventListeners).forEach(
      (key) => delete mockEventListeners[key],
    );

    (SDKConnect.getInstance as jest.Mock).mockReturnValue(mockSDKConnectInstance);

    (Engine.context as any) = {
      KeyringController: mockKeyringController,
      PermissionController: mockPermissionController,
      NetworkController: mockNetworkController,
      AccountsController: mockAccountsController,
    };

    mockKeyringController.isUnlocked.mockReturnValue(true);
    mockSDKConnectInstance.isAndroidSDKBound.mockReturnValue(true);
  });

  describe('NativeModules.CommunicationClient Mock Behavior', () => {
    it('should have sendMessage method available', () => {
      expect(NativeModules.CommunicationClient.sendMessage).toBeDefined();
    });

    it('should call sendMessage with stringified message', async () => {
      service = new AndroidService();
      const testMessage = { data: { id: 'test', result: 'success' } };

      await service.sendMessage(testMessage);

      expect(NativeModules.CommunicationClient.sendMessage).toHaveBeenCalledWith(
        JSON.stringify(testMessage),
      );
    });

    it('should handle sendMessage errors gracefully', async () => {
      (NativeModules.CommunicationClient.sendMessage as jest.Mock).mockImplementation(
        () => {
          throw new Error('Native send failed');
        },
      );

      service = new AndroidService();
      const testMessage = { data: { id: 'test', result: 'success' } };

      await expect(service.sendMessage(testMessage)).rejects.toThrow(
        'Native send failed',
      );
    });
  });

  describe('Native-to-JS Message Bridging (setupOnMessageReceivedListener)', () => {
    beforeEach(() => {
      service = new AndroidService();
    });

    it('should parse valid JSON messages correctly', async () => {
      const mockBridge = { onMessage: jest.fn() };
      service.bridgeByClientId['session-1'] = mockBridge as any;
      service.connections['session-1'] = {
        clientId: 'session-1',
        originatorInfo: { url: 'test.com', title: 'Test', platform: 'test', dappId: 'dapp1' },
        connected: false,
        validUntil: Date.now() + 100000,
      };

      (handleCustomRpcCalls as jest.Mock).mockResolvedValue({
        id: 'rpc-1',
        method: 'eth_accounts',
        params: [],
      });

      const validMessage = JSON.stringify({
        id: 'session-1',
        message: JSON.stringify({
          id: 'rpc-1',
          jsonrpc: '2.0',
          method: 'eth_accounts',
          params: [],
        }),
      });

      if (mockEventListeners[EventType.MESSAGE]) {
        mockEventListeners[EventType.MESSAGE](validMessage);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(DevLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('onMessageReceived'),
        expect.anything(),
      );
    });

    it('should update connection state to connected when message received', async () => {
      const mockBridge = { onMessage: jest.fn() };
      service.bridgeByClientId['session-2'] = mockBridge as any;
      service.connections['session-2'] = {
        clientId: 'session-2',
        originatorInfo: { url: 'test.com', title: 'Test', platform: 'test', dappId: 'dapp2' },
        connected: false,
        validUntil: Date.now() + 100000,
      };

      (handleCustomRpcCalls as jest.Mock).mockResolvedValue({
        id: 'rpc-2',
        method: 'eth_chainId',
        params: [],
      });

      const message = JSON.stringify({
        id: 'session-2',
        message: JSON.stringify({
          id: 'rpc-2',
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
        }),
      });

      if (mockEventListeners[EventType.MESSAGE]) {
        mockEventListeners[EventType.MESSAGE](message);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(service.connections['session-2'].connected).toBe(true);
    });

    it('should send error response for invalid JSON messages', async () => {
      const invalidJson = 'not valid json {{{';

      if (mockEventListeners[EventType.MESSAGE]) {
        mockEventListeners[EventType.MESSAGE](invalidJson);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(Logger.log).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining('invalid json param'),
      );
    });

    it('should route messages to correct bridge by clientId', async () => {
      const mockBridge1 = { onMessage: jest.fn() };
      const mockBridge2 = { onMessage: jest.fn() };
      service.bridgeByClientId['client-a'] = mockBridge1 as any;
      service.bridgeByClientId['client-b'] = mockBridge2 as any;
      service.connections['client-a'] = {
        clientId: 'client-a',
        originatorInfo: { url: 'a.com', title: 'A', platform: 'test', dappId: 'a' },
        connected: false,
        validUntil: Date.now() + 100000,
      };
      service.connections['client-b'] = {
        clientId: 'client-b',
        originatorInfo: { url: 'b.com', title: 'B', platform: 'test', dappId: 'b' },
        connected: false,
        validUntil: Date.now() + 100000,
      };

      (handleCustomRpcCalls as jest.Mock).mockResolvedValue({
        id: 'rpc-a',
        method: 'eth_accounts',
        params: [],
      });

      const messageForClientA = JSON.stringify({
        id: 'client-a',
        message: JSON.stringify({
          id: 'rpc-a',
          jsonrpc: '2.0',
          method: 'eth_accounts',
          params: [],
        }),
      });

      if (mockEventListeners[EventType.MESSAGE]) {
        mockEventListeners[EventType.MESSAGE](messageForClientA);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(service.currentClientId).toBe('client-a');
    });

    it('should recreate bridge when bridge is missing for existing connection', async () => {
      service.connections['orphan-session'] = {
        clientId: 'orphan-session',
        originatorInfo: { url: 'orphan.com', title: 'Orphan', platform: 'test', dappId: 'orphan' },
        connected: false,
        validUntil: Date.now() + 100000,
      };

      mockPermissionController.requestPermissions.mockResolvedValue(null);

      const message = JSON.stringify({
        id: 'orphan-session',
        message: JSON.stringify({
          id: 'rpc-orphan',
          jsonrpc: '2.0',
          method: 'eth_accounts',
          params: [],
        }),
      });

      if (mockEventListeners[EventType.MESSAGE]) {
        mockEventListeners[EventType.MESSAGE](message);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(mockPermissionController.requestPermissions).toHaveBeenCalled();
    });
  });

  describe('Connection Lifecycle Management', () => {
    beforeEach(() => {
      service = new AndroidService();
    });

    it('should handle new client connection', async () => {
      const clientInfo = {
        clientId: 'new-client-1',
        originatorInfo: {
          url: 'newclient.com',
          title: 'New Client',
          platform: 'android',
          dappId: 'new-dapp',
        },
      };

      if (mockEventListeners[EventType.CLIENTS_CONNECTED]) {
        mockEventListeners[EventType.CLIENTS_CONNECTED](JSON.stringify(clientInfo));
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(mockSDKConnectInstance.addDappConnection).toHaveBeenCalled();
    });

    it('should send READY message for existing client reconnection', async () => {
      service.connections['existing-client'] = {
        clientId: 'existing-client',
        originatorInfo: { url: 'existing.com', title: 'Existing', platform: 'test', dappId: 'existing' },
        connected: false,
        validUntil: Date.now() + 100000,
      };

      const clientInfo = {
        clientId: 'existing-client',
        originatorInfo: {
          url: 'existing.com',
          title: 'Existing',
          platform: 'test',
          dappId: 'existing',
        },
      };

      if (mockEventListeners[EventType.CLIENTS_CONNECTED]) {
        mockEventListeners[EventType.CLIENTS_CONNECTED](JSON.stringify(clientInfo));
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(service.connections['existing-client'].connected).toBe(true);
    });

    it('should remove connection and bridge on removeConnection', async () => {
      service.connections['to-remove'] = {
        clientId: 'to-remove',
        originatorInfo: { url: 'remove.com', title: 'Remove', platform: 'test', dappId: 'remove' },
        connected: true,
        validUntil: Date.now() + 100000,
      };
      service.bridgeByClientId['to-remove'] = { onMessage: jest.fn() } as any;

      await service.removeConnection('to-remove');

      expect(service.connections['to-remove']).toBeUndefined();
      expect(service.bridgeByClientId['to-remove']).toBeUndefined();
    });

    it('should handle removeConnection for non-existent connection', async () => {
      await expect(
        service.removeConnection('non-existent'),
      ).resolves.not.toThrow();
    });

    it('should restore previous connections on init', async () => {
      const previousConnections = {
        'prev-1': {
          id: 'prev-1',
          originatorInfo: { url: 'prev1.com', title: 'Prev 1', platform: 'test', dappId: 'prev1' },
          validUntil: Date.now() + 100000,
        },
        'prev-2': {
          id: 'prev-2',
          originatorInfo: { url: 'prev2.com', title: 'Prev 2', platform: 'test', dappId: 'prev2' },
          validUntil: Date.now() + 100000,
        },
      };

      mockSDKConnectInstance.loadDappConnections.mockResolvedValue(previousConnections);

      service = new AndroidService();

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(mockSDKConnectInstance.loadDappConnections).toHaveBeenCalled();
    });

    it('should save connection with correct validUntil timestamp', async () => {
      const clientInfo = {
        clientId: 'timestamp-client',
        originatorInfo: {
          url: 'timestamp.com',
          title: 'Timestamp',
          platform: 'android',
          dappId: 'timestamp',
        },
      };

      if (mockEventListeners[EventType.CLIENTS_CONNECTED]) {
        mockEventListeners[EventType.CLIENTS_CONNECTED](JSON.stringify(clientInfo));
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(mockSDKConnectInstance.addDappConnection).toHaveBeenCalledWith(
        expect.objectContaining({
          validUntil: expect.any(Number),
        }),
      );
    });
  });

  describe('Error Recovery Scenarios', () => {
    beforeEach(() => {
      service = new AndroidService();
    });

    it('should wait for keychain to be unlocked before processing messages', async () => {
      mockKeyringController.isUnlocked.mockReturnValue(false);

      const mockBridge = { onMessage: jest.fn() };
      service.bridgeByClientId['locked-session'] = mockBridge as any;
      service.connections['locked-session'] = {
        clientId: 'locked-session',
        originatorInfo: { url: 'locked.com', title: 'Locked', platform: 'test', dappId: 'locked' },
        connected: false,
        validUntil: Date.now() + 100000,
      };

      const message = JSON.stringify({
        id: 'locked-session',
        message: JSON.stringify({
          id: 'rpc-locked',
          jsonrpc: '2.0',
          method: 'eth_accounts',
          params: [],
        }),
      });

      if (mockEventListeners[EventType.MESSAGE]) {
        mockEventListeners[EventType.MESSAGE](message);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockKeyringController.isUnlocked).toHaveBeenCalled();
    });

    it('should handle permission rejection during connection', async () => {
      mockPermissionController.requestPermissions.mockRejectedValue(
        new Error('User rejected'),
      );

      const clientInfo = {
        clientId: 'rejected-client',
        originatorInfo: {
          url: 'rejected.com',
          title: 'Rejected',
          platform: 'android',
          dappId: 'rejected',
        },
      };

      if (mockEventListeners[EventType.CLIENTS_CONNECTED]) {
        mockEventListeners[EventType.CLIENTS_CONNECTED](JSON.stringify(clientInfo));
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(Logger.log).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining('connection rejected'),
      );
    });

    it('should handle network controller errors gracefully', async () => {
      mockNetworkController.getNetworkClientById.mockImplementation(() => {
        throw new Error('Network not available');
      });

      const mockBridge = { onMessage: jest.fn() };
      service.bridgeByClientId['network-error-session'] = mockBridge as any;
      service.connections['network-error-session'] = {
        clientId: 'network-error-session',
        originatorInfo: { url: 'network.com', title: 'Network', platform: 'test', dappId: 'network' },
        connected: false,
        validUntil: Date.now() + 100000,
      };

      const message = JSON.stringify({
        id: 'network-error-session',
        message: JSON.stringify({
          id: 'rpc-network',
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
        }),
      });

      if (mockEventListeners[EventType.MESSAGE]) {
        mockEventListeners[EventType.MESSAGE](message);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(Logger.log).toHaveBeenCalled();
    });

    it('should handle bridge initialization failures', () => {
      (BackgroundBridge as unknown as jest.Mock).mockImplementation(() => {
        throw new Error('Bridge init failed');
      });

      const clientInfo = {
        clientId: 'bridge-fail-client',
        originatorInfo: { url: 'fail.com', title: 'Fail', platform: 'test', dappId: 'fail' },
        connected: false,
        validUntil: Date.now() + 100000,
      };

      expect(() => {
        (service as any).setupBridge(clientInfo);
      }).toThrow('Bridge init failed');
    });

    it('should log error when permission check fails during bridge recreation', async () => {
      service.connections['perm-fail-session'] = {
        clientId: 'perm-fail-session',
        originatorInfo: { url: 'permfail.com', title: 'PermFail', platform: 'test', dappId: 'permfail' },
        connected: false,
        validUntil: Date.now() + 100000,
      };

      mockPermissionController.requestPermissions.mockRejectedValue(
        new Error('Permission denied'),
      );

      const message = JSON.stringify({
        id: 'perm-fail-session',
        message: JSON.stringify({
          id: 'rpc-permfail',
          jsonrpc: '2.0',
          method: 'eth_accounts',
          params: [],
        }),
      });

      if (mockEventListeners[EventType.MESSAGE]) {
        mockEventListeners[EventType.MESSAGE](message);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(Logger.log).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining('error checking permissions'),
      );
    });
  });

  describe('Concurrent Message Handling', () => {
    beforeEach(() => {
      service = new AndroidService();
    });

    it('should handle multiple messages from different clients', async () => {
      const mockBridge1 = { onMessage: jest.fn() };
      const mockBridge2 = { onMessage: jest.fn() };
      service.bridgeByClientId['concurrent-1'] = mockBridge1 as any;
      service.bridgeByClientId['concurrent-2'] = mockBridge2 as any;
      service.connections['concurrent-1'] = {
        clientId: 'concurrent-1',
        originatorInfo: { url: 'c1.com', title: 'C1', platform: 'test', dappId: 'c1' },
        connected: false,
        validUntil: Date.now() + 100000,
      };
      service.connections['concurrent-2'] = {
        clientId: 'concurrent-2',
        originatorInfo: { url: 'c2.com', title: 'C2', platform: 'test', dappId: 'c2' },
        connected: false,
        validUntil: Date.now() + 100000,
      };

      (handleCustomRpcCalls as jest.Mock).mockResolvedValue({
        id: 'rpc-concurrent',
        method: 'eth_accounts',
        params: [],
      });

      const message1 = JSON.stringify({
        id: 'concurrent-1',
        message: JSON.stringify({
          id: 'rpc-1',
          jsonrpc: '2.0',
          method: 'eth_accounts',
          params: [],
        }),
      });

      const message2 = JSON.stringify({
        id: 'concurrent-2',
        message: JSON.stringify({
          id: 'rpc-2',
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
        }),
      });

      if (mockEventListeners[EventType.MESSAGE]) {
        mockEventListeners[EventType.MESSAGE](message1);
        mockEventListeners[EventType.MESSAGE](message2);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(service.connections['concurrent-1'].connected).toBe(true);
      expect(service.connections['concurrent-2'].connected).toBe(true);
    });

    it('should track currentClientId correctly across messages', async () => {
      const mockBridge = { onMessage: jest.fn() };
      service.bridgeByClientId['tracking-client'] = mockBridge as any;
      service.connections['tracking-client'] = {
        clientId: 'tracking-client',
        originatorInfo: { url: 'track.com', title: 'Track', platform: 'test', dappId: 'track' },
        connected: false,
        validUntil: Date.now() + 100000,
      };

      (handleCustomRpcCalls as jest.Mock).mockResolvedValue({
        id: 'rpc-track',
        method: 'eth_accounts',
        params: [],
      });

      const message = JSON.stringify({
        id: 'tracking-client',
        message: JSON.stringify({
          id: 'rpc-track',
          jsonrpc: '2.0',
          method: 'eth_accounts',
          params: [],
        }),
      });

      if (mockEventListeners[EventType.MESSAGE]) {
        mockEventListeners[EventType.MESSAGE](message);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(service.currentClientId).toBe('tracking-client');
    });
  });

  describe('getConnections', () => {
    beforeEach(() => {
      service = new AndroidService();
    });

    it('should return all valid connections', () => {
      service.connections['conn-1'] = {
        clientId: 'conn-1',
        originatorInfo: { url: 'c1.com', title: 'C1', platform: 'test', dappId: 'c1' },
        connected: true,
        validUntil: Date.now() + 100000,
      };
      service.connections['conn-2'] = {
        clientId: 'conn-2',
        originatorInfo: { url: 'c2.com', title: 'C2', platform: 'test', dappId: 'c2' },
        connected: false,
        validUntil: Date.now() + 100000,
      };

      const connections = service.getConnections();

      expect(connections).toHaveLength(2);
      expect(connections.map((c) => c.clientId)).toContain('conn-1');
      expect(connections.map((c) => c.clientId)).toContain('conn-2');
    });

    it('should filter out connections with empty clientId', () => {
      service.connections.valid = {
        clientId: 'valid',
        originatorInfo: { url: 'valid.com', title: 'Valid', platform: 'test', dappId: 'valid' },
        connected: true,
        validUntil: Date.now() + 100000,
      };
      service.connections[''] = {
        clientId: '',
        originatorInfo: { url: 'empty.com', title: 'Empty', platform: 'test', dappId: 'empty' },
        connected: true,
        validUntil: Date.now() + 100000,
      };

      const connections = service.getConnections();

      expect(connections).toHaveLength(1);
      expect(connections[0].clientId).toBe('valid');
    });
  });

  describe('RPC Queue Management', () => {
    beforeEach(() => {
      service = new AndroidService();
    });

    it('should add RPC to queue when message is received', async () => {
      const mockBridge = { onMessage: jest.fn() };
      service.bridgeByClientId['queue-client'] = mockBridge as any;
      service.connections['queue-client'] = {
        clientId: 'queue-client',
        originatorInfo: { url: 'queue.com', title: 'Queue', platform: 'test', dappId: 'queue' },
        connected: false,
        validUntil: Date.now() + 100000,
      };

      (handleCustomRpcCalls as jest.Mock).mockResolvedValue({
        id: 'rpc-queue',
        method: 'eth_sendTransaction',
        params: [{ to: '0x123', value: '0x1' }],
      });

      const addSpy = jest.spyOn(service.rpcQueueManager, 'add');

      const message = JSON.stringify({
        id: 'queue-client',
        message: JSON.stringify({
          id: 'rpc-queue',
          jsonrpc: '2.0',
          method: 'eth_sendTransaction',
          params: [{ to: '0x123', value: '0x1' }],
        }),
      });

      if (mockEventListeners[EventType.MESSAGE]) {
        mockEventListeners[EventType.MESSAGE](message);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'rpc-queue',
          method: 'eth_sendTransaction',
        }),
      );
    });
  });
});
