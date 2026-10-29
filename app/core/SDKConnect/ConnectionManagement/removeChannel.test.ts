import AppConstants from '../../../core/AppConstants';
import SDKConnect from '../SDKConnect';
import type Engine from '../../Engine';
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
  describe('when the terminate message cannot be delivered', () => {
    const mockChannelId = 'mockChannelId';
    const mockHost = AppConstants.MM_SDK.SDK_REMOTE_ORIGIN + mockChannelId;
    let mockRevokeAllPermissions: jest.Mock;
    let mockRejectApproval: jest.Mock;
    let mockEngine: typeof Engine;
    let mockOnDisconnect: jest.Mock;
    let mockRemoteDisconnect: jest.Mock;

    const setupConnection = (removeConnection: jest.Mock) => {
      mockOnDisconnect = jest.fn();
      mockRemoteDisconnect = jest.fn();
      mockInstance.state.connected[mockChannelId] = {
        removeConnection,
        backgroundBridge: { onDisconnect: mockOnDisconnect },
        remote: { disconnect: mockRemoteDisconnect },
      } as unknown as SDKConnect['state']['connected'][string];
      mockInstance.state.connections[mockChannelId] = {
        id: mockChannelId,
      } as unknown as SDKConnect['state']['connections'][string];
      mockInstance.state.approvedHosts[mockHost] = 1234567890;
    };

    beforeEach(() => {
      mockRevokeAllPermissions = jest.fn();
      mockRejectApproval = jest.fn();
      mockEngine = {
        context: {
          ApprovalController: {
            state: {
              pendingApprovals: {
                approvalForChannel: {
                  id: 'approvalForChannel',
                  origin: mockChannelId,
                },
                otherApproval: { id: 'otherApproval', origin: 'otherOrigin' },
              },
            },
            reject: mockRejectApproval,
          },
          PermissionController: {
            getPermissions: jest.fn().mockReturnValue({ eth_accounts: {} }),
            revokeAllPermissions: mockRevokeAllPermissions,
          },
        },
      } as unknown as typeof Engine;
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('revokes permissions and removes the session when terminate fails', async () => {
      setupConnection(jest.fn().mockResolvedValue(false));

      const result = await removeChannel({
        channelId: mockChannelId,
        engine: mockEngine,
        sendTerminate: true,
        instance: mockInstance,
      });

      expect(result).toBe(true);
      expect(mockRevokeAllPermissions).toHaveBeenCalledWith(mockChannelId);
      expect(mockInstance.state.connected[mockChannelId]).toBeUndefined();
      expect(mockInstance.state.connections[mockChannelId]).toBeUndefined();
      expect(mockInstance.state.approvedHosts[mockHost]).toBeUndefined();
      expect(mockOnDisconnect).toHaveBeenCalled();
      expect(mockRemoteDisconnect).toHaveBeenCalled();
    });

    it('revokes permissions before attempting to send terminate', () => {
      const removeConnection = jest.fn(() => {
        expect(mockRevokeAllPermissions).toHaveBeenCalledWith(mockChannelId);
        return Promise.resolve(true);
      });
      setupConnection(removeConnection);

      removeChannel({
        channelId: mockChannelId,
        engine: mockEngine,
        sendTerminate: true,
        instance: mockInstance,
      });

      expect(removeConnection).toHaveBeenCalled();
    });

    it('does not wait indefinitely when terminate never resolves', async () => {
      jest.useFakeTimers();
      setupConnection(jest.fn(() => new Promise<boolean>(() => undefined)));

      const promise = removeChannel({
        channelId: mockChannelId,
        engine: mockEngine,
        sendTerminate: true,
        instance: mockInstance,
      });

      expect(mockRevokeAllPermissions).toHaveBeenCalledWith(mockChannelId);
      expect(mockInstance.state.connected[mockChannelId]).toBeUndefined();

      jest.advanceTimersByTime(TERMINATE_TIMEOUT_MS);
      await expect(promise).resolves.toBe(true);
      expect(mockRemoteDisconnect).toHaveBeenCalled();
    });

    it('revokes permissions when sending terminate throws', async () => {
      setupConnection(jest.fn().mockRejectedValue(new Error('offline')));
      jest.spyOn(console, 'error').mockImplementation(() => undefined);

      await removeChannel({
        channelId: mockChannelId,
        engine: mockEngine,
        sendTerminate: true,
        instance: mockInstance,
      });

      expect(mockRevokeAllPermissions).toHaveBeenCalledWith(mockChannelId);
      expect(mockInstance.state.connected[mockChannelId]).toBeUndefined();
    });

    it('does not close the relay locally when terminate succeeds', async () => {
      setupConnection(jest.fn().mockResolvedValue(true));

      await removeChannel({
        channelId: mockChannelId,
        engine: mockEngine,
        sendTerminate: true,
        instance: mockInstance,
      });

      expect(mockRevokeAllPermissions).toHaveBeenCalledWith(mockChannelId);
      expect(mockRemoteDisconnect).not.toHaveBeenCalled();
    });
    it('rejects in-flight approvals for the removed channel', async () => {
      setupConnection(jest.fn().mockResolvedValue(true));
      const connection = mockInstance.state.connected[mockChannelId];
      connection.approvalPromise = Promise.resolve();

      await removeChannel({
        channelId: mockChannelId,
        engine: mockEngine,
        sendTerminate: true,
        instance: mockInstance,
      });

      expect(mockRejectApproval).toHaveBeenCalledTimes(1);
      expect(mockRejectApproval).toHaveBeenCalledWith(
        'approvalForChannel',
        expect.anything(),
      );
      expect(connection.approvalPromise).toBeUndefined();
    });

    it('does not report success or drop the session when revocation fails', async () => {
      setupConnection(jest.fn().mockResolvedValue(true));
      mockRevokeAllPermissions.mockImplementation(() => {
        throw new Error('revoke failed');
      });

      await expect(
        removeChannel({
          channelId: mockChannelId,
          engine: mockEngine,
          sendTerminate: true,
          instance: mockInstance,
        }),
      ).rejects.toThrow('revoke failed');
      expect(mockInstance.state.connections[mockChannelId]).toBeDefined();
    });

    it('closes the relay even if bridge cleanup throws', async () => {
      setupConnection(jest.fn().mockResolvedValue(false));
      mockOnDisconnect.mockImplementation(() => {
        throw new Error('bridge failed');
      });
      jest.spyOn(console, 'error').mockImplementation(() => undefined);

      await removeChannel({
        channelId: mockChannelId,
        engine: mockEngine,
        sendTerminate: true,
        instance: mockInstance,
      });

      expect(mockRemoteDisconnect).toHaveBeenCalled();
    });
  });
});
