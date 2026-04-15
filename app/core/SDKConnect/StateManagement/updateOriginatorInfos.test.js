
import StorageWrapper from '../../../store/storage-wrapper';

import updateOriginatorInfos from './updateOriginatorInfos';

jest.mock('@metamask/sdk-communication-layer');
jest.mock('../SDKConnect');
jest.mock('../../../store/storage-wrapper');
jest.mock('../../AppConstants');

jest.mock('../../../store/storage-wrapper', () => ({
  setItem: jest.fn()
}));

describe('updateOriginatorInfos', () => {
  let mockInstance = {};

  const mockStorageWrapperSet = StorageWrapper.setItem;



  const mockEmit = jest.fn();

  const spyWarn = jest.spyOn(console, 'warn');

  beforeEach(() => {
    jest.clearAllMocks();

    mockStorageWrapperSet.mockResolvedValue(undefined);

    mockInstance = {
      state: {
        connections: {}
      },
      emit: mockEmit
    };
  });

  it('should warn and return if no connection exists', () => {
    const mockChannelId = 'mockChannelId';
    const mockOriginatorInfo = {};

    updateOriginatorInfos({
      channelId: mockChannelId,
      originatorInfo: mockOriginatorInfo,
      instance: mockInstance
    });

    expect(spyWarn).toHaveBeenCalledWith(
      'SDKConnect::updateOriginatorInfos - no connection'
    );
  });

  it('should update originatorInfo for the connection', () => {
    const mockChannelId = 'mockChannelId';
    const mockOriginatorInfo = {};
    mockInstance.state.connections[mockChannelId] = {
      originatorInfo: {}
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    };

    updateOriginatorInfos({
      channelId: mockChannelId,
      originatorInfo: mockOriginatorInfo,
      instance: mockInstance
    });

    expect(mockInstance.state.connections[mockChannelId].originatorInfo).toBe(
      mockOriginatorInfo
    );
  });
});