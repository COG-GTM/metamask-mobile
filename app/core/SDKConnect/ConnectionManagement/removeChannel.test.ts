import AppConstants from '../../../core/AppConstants';
import SDKConnect from '../SDKConnect';
import Engine from '../../Engine';
import removeChannel, { TERMINATE_TIMEOUT_MS } from './removeChannel';

jest.mock('../../../core/AppConstants');
jest.mock('../SDKConnect');
jest.mock('../utils/DevLogger');
jest.mock('../../../store/storage-wrapper', () => ({
  setItem: jest.fn().mockResolvedValue([]),
  getItem: jest.fn().mockResolvedValue(JSON.stringify({})),
}));

describe('removeChannel', () => {
  let mockInstance = {} as unknown as SDKConnect;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInstance = {
      state: {
        connected: {},
        connections: {},
        approvedHosts: {},
        disabledHosts: {},
        connecting: {},
      },
    } as unknown as SDKConnect;
  });

  describe('Removing a connected channel', () => {
    it('should remove the connection', () => {
      const mockChannelId = 'mockChannelId';
      const mockOtherPublicKey = 'mockOtherPublicKey';

      mockInstance.state.connected[mockChannelId] = {
        otherPublicKey: mockOtherPublicKey,
        removeConnection: jest.fn().mockResolvedValue(true),
      } as unknown as SDKConnect['state']['connected'][string];

      removeChannel({
        channelId: mockChannelId,
        instance: mockInstance,
      });

      expect(mockInstance.state.connected[mockChannelId]).toBeUndefined();
    });

    it('should delete the channel from the connected state', () => {
      const mockChannelId = 'mockChannelId';
      const mockOtherPublicKey = 'mockOtherPublicKey';

      mockInstance.state.connected[mockChannelId] = {
        otherPublicKey: mockOtherPublicKey,
        removeConnection: jest.fn().mockResolvedValue(true),
      } as unknown as SDKConnect['state']['connected'][string];

      removeChannel({
        channelId: mockChannelId,
        instance: mockInstance,
      });

      expect(mockInstance.state.connected[mockChannelId]).toBeUndefined();
    });

    it('should delete the channel from the connections state', () => {
      const mockChannelId = 'mockChannelId';
      const mockOtherPublicKey = 'mockOtherPublicKey';

      mockInstance.state.connected[mockChannelId] = {
        otherPublicKey: mockOtherPublicKey,
        removeConnection: jest.fn().mockResolvedValue(true),
      } as unknown as SDKConnect['state']['connected'][string];

      removeChannel({
        channelId: mockChannelId,
        instance: mockInstance,
      });

      expect(mockInstance.state.connections[mockChannelId]).toBeUndefined();
    });

    it('should delete the channel from the approved hosts', () => {
      const mockChannelId = 'mockChannelId';
      const mockOtherPublicKey = 'mockOtherPublicKey';
      const mockHost = AppConstants.MM_SDK.SDK_REMOTE_ORIGIN + mockChannelId;

      mockInstance.state.connected[mockChannelId] = {
        otherPublicKey: mockOtherPublicKey,
        removeConnection: jest.fn().mockResolvedValue(true),
      } as unknown as SDKConnect['state']['connected'][string];

      mockInstance.state.approvedHosts[mockHost] = 1234567890;

      removeChannel({
        channelId: mockChannelId,
        instance: mockInstance,
      });

      expect(mockInstance.state.approvedHosts[mockHost]).toBeUndefined();
    });

    it('should delete the channel from the disabled hosts', () => {
      const mockChannelId = 'mockChannelId';
      const mockOtherPublicKey = 'mockOtherPublicKey';
      const mockHost = AppConstants.MM_SDK.SDK_REMOTE_ORIGIN + mockChannelId;

      mockInstance.state.connected[mockChannelId] = {
        otherPublicKey: mockOtherPublicKey,
        removeConnection: jest.fn().mockResolvedValue(true),
      } as unknown as SDKConnect['state']['connected'][string];

      mockInstance.state.disabledHosts[mockHost] = 1234567890;

      removeChannel({
        channelId: mockChannelId,
        instance: mockInstance,
      });

      expect(mockInstance.state.disabledHosts[mockHost]).toBeUndefined();
    });
  });

  it('should delete the channel from the connecting state', () => {
    const mockChannelId = 'mockChannelId';

    mockInstance.state.connecting[mockChannelId] = true;

    removeChannel({
      channelId: mockChannelId,
      instance: mockInstance,
    });

    expect(mockInstance.state.connecting[mockChannelId]).toBeUndefined();
  });

  describe('Revoking a channel whose dapp cannot be reached', () => {
    const mockChannelId = 'mockChannelId';
    const mockHost = AppConstants.MM_SDK.SDK_REMOTE_ORIGIN + mockChannelId;
    let mockRemoveConnection: jest.Mock;
    let mockRemoteDisconnect: jest.Mock;
    let mockOnDisconnect: jest.Mock;
    let mockGetPermissions: jest.Mock;
    let mockRevokeAllPermissions: jest.Mock;
    let mockEngine: typeof Engine;

    beforeEach(() => {
      mockRemoveConnection = jest.fn();
      mockRemoteDisconnect = jest.fn().mockResolvedValue(true);
      mockOnDisconnect = jest.fn();
      mockGetPermissions = jest.fn().mockReturnValue({ eth_accounts: {} });
      mockRevokeAllPermissions = jest.fn();
      mockEngine = {
        context: {
          PermissionController: {
            getPermissions: mockGetPermissions,
            revokeAllPermissions: mockRevokeAllPermissions,
          },
        },
      } as unknown as typeof Engine;

      mockInstance.state.connected[mockChannelId] = {
        channelId: mockChannelId,
        removeConnection: mockRemoveConnection,
        remote: { disconnect: mockRemoteDisconnect },
        backgroundBridge: { onDisconnect: mockOnDisconnect },
        isReady: true,
      } as unknown as SDKConnect['state']['connected'][string];
      mockInstance.state.connections[mockChannelId] = {
        id: mockChannelId,
      } as unknown as SDKConnect['state']['connections'][string];
      mockInstance.state.approvedHosts[mockHost] = 1234567890;
    });

    const expectRevoked = () => {
      expect(mockInstance.state.connected[mockChannelId]).toBeUndefined();
      expect(mockInstance.state.connections[mockChannelId]).toBeUndefined();
      expect(mockInstance.state.approvedHosts[mockHost]).toBeUndefined();
      expect(mockRevokeAllPermissions).toHaveBeenCalledWith(mockChannelId);
    };

    it('revokes permissions and session when the terminate message is not delivered', async () => {
      mockRemoveConnection.mockResolvedValue(false);

      const result = await removeChannel({
        channelId: mockChannelId,
        engine: mockEngine,
        sendTerminate: true,
        instance: mockInstance,
      });

      expect(result).toBe(true);
      expectRevoked();
      expect(mockRemoveConnection).toHaveBeenCalledWith({
        terminate: true,
        context: 'SDKConnect::removeChannel',
      });
      expect(mockOnDisconnect).toHaveBeenCalled();
      expect(mockRemoteDisconnect).toHaveBeenCalledWith({
        terminate: true,
        sendMessage: false,
      });
    });

    it('revokes permissions and session when sending terminate throws', async () => {
      mockRemoveConnection.mockRejectedValue(new Error('relay down'));
      jest.spyOn(console, 'error').mockImplementation(() => undefined);

      await removeChannel({
        channelId: mockChannelId,
        engine: mockEngine,
        sendTerminate: true,
        instance: mockInstance,
      });

      expectRevoked();
      expect(mockRemoteDisconnect).toHaveBeenCalledWith({
        terminate: true,
        sendMessage: false,
      });
    });

    it('revokes synchronously and gives up on terminate after the timeout when the dapp never joins', async () => {
      jest.useFakeTimers();
      try {
        mockRemoveConnection.mockReturnValue(new Promise(() => undefined));

        let settled = false;
        const pending = removeChannel({
          channelId: mockChannelId,
          engine: mockEngine,
          sendTerminate: true,
          instance: mockInstance,
        }).then((result) => {
          settled = true;
          return result;
        });

        expectRevoked();
        await Promise.resolve();
        expect(settled).toBe(false);

        jest.advanceTimersByTime(TERMINATE_TIMEOUT_MS);
        await expect(pending).resolves.toBe(true);
        expect(mockRemoteDisconnect).toHaveBeenCalledWith({
          terminate: true,
          sendMessage: false,
        });
      } finally {
        jest.useRealTimers();
      }
    });

    it('does not force-close the remote when terminate is delivered', async () => {
      mockRemoveConnection.mockResolvedValue(true);

      await removeChannel({
        channelId: mockChannelId,
        engine: mockEngine,
        sendTerminate: true,
        instance: mockInstance,
      });

      expectRevoked();
      expect(mockRemoteDisconnect).not.toHaveBeenCalled();
    });

    it('does not send terminate when sendTerminate is false', async () => {
      mockRemoveConnection.mockResolvedValue(false);

      await removeChannel({
        channelId: mockChannelId,
        engine: mockEngine,
        sendTerminate: false,
        instance: mockInstance,
      });

      expectRevoked();
      expect(mockRemoveConnection).toHaveBeenCalledWith({
        terminate: false,
        context: 'SDKConnect::removeChannel',
      });
    });
  });
});
