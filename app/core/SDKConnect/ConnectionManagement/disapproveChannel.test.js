import disapproveChannel from './disapproveChannel';

import AppConstants from '../../../core/AppConstants';

jest.mock('../../../core/AppConstants');
jest.mock('../SDKConnect');

describe('disapproveChannel', () => {
  let mockInstance = {};

  beforeEach(() => {
    jest.clearAllMocks();

    mockInstance = {
      state: {
        connections: {},
        approvedHosts: {}
      }
    };
  });

  it('should reset last authorized time for the channel in connections', () => {
    const mockChannelId = 'mockChannelId';
    const mockApprovedUntil = 1234567890;

    mockInstance.state.connections[mockChannelId] = {
      lastAuthorized: mockApprovedUntil
    };

    disapproveChannel({
      channelId: mockChannelId,
      instance: mockInstance
    });

    expect(mockInstance.state.connections[mockChannelId].lastAuthorized).toBe(
      0
    );
  });

  it('should remove the host from the approved hosts list', () => {
    const channelId = 'channelId';
    const mockApprovedUntil = 1234567890;
    const hostname = AppConstants.MM_SDK.SDK_REMOTE_ORIGIN + channelId;

    mockInstance.state.approvedHosts[hostname] = mockApprovedUntil;
    mockInstance.state.connections[channelId] = {
      lastAuthorized: mockApprovedUntil
    };

    disapproveChannel({
      channelId,
      instance: mockInstance
    });

    expect(mockInstance.state.approvedHosts[hostname]).toBe(undefined);
  });
});