import AppConstants from '../../../core/AppConstants';
import SDKConnect from '../SDKConnect';
import removeChannel from './removeChannel';

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

  describe('Removing a channel whose peer cannot be notified', () => {
    const mockChannelId = 'mockChannelId';
    let mockRemoteDisconnect: jest.Mock;
    let mockBridgeDisconnect: jest.Mock;

    beforeEach(() => {
      mockRemoteDisconnect = jest.fn();
      mockBridgeDisconnect = jest.fn();
      mockInstance.state.connected[mockChannelId] = {
        removeConnection: jest.fn().mockResolvedValue(false),
        remote: { disconnect: mockRemoteDisconnect },
        backgroundBridge: { onDisconnect: mockBridgeDisconnect },
      } as unknown as SDKConnect['state']['connected'][string];
      mockInstance.state.connections[mockChannelId] = {
        id: mockChannelId,
      } as unknown as SDKConnect['state']['connections'][string];
    });

    it('keeps the channel when terminate fails without force', async () => {
      const removed = await removeChannel({
        channelId: mockChannelId,
        sendTerminate: true,
        instance: mockInstance,
      });

      expect(removed).toBe(false);
      expect(mockInstance.state.connections[mockChannelId]).toBeDefined();
      expect(mockRemoteDisconnect).not.toHaveBeenCalled();
    });

    it('removes the channel locally when terminate fails with force', async () => {
      const removed = await removeChannel({
        channelId: mockChannelId,
        sendTerminate: true,
        force: true,
        instance: mockInstance,
      });

      expect(removed).toBe(true);
      expect(mockBridgeDisconnect).toHaveBeenCalled();
      expect(mockRemoteDisconnect).toHaveBeenCalled();
      expect(mockInstance.state.connected[mockChannelId]).toBeUndefined();
      expect(mockInstance.state.connections[mockChannelId]).toBeUndefined();
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
});
