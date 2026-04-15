import Device from '../../../util/device';

import unmount from './unmount';

jest.mock('react-native-background-timer');
jest.mock('../../../util/Logger');
jest.mock('../../../util/device');
jest.mock('../SDKConnect');

describe('unmount', () => {
  let mockInstance = {};
  const mockIsAndroid = Device.isAndroid;


  const mockAppStateListenerRemove = jest.fn();

  const spyClearTimeout = jest.spyOn(global, 'clearTimeout');

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useFakeTimers({ legacyFakeTimers: true });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    spyClearTimeout.mockImplementation(() => {

      //do nothing
    });mockInstance = {
      state: {
        appStateListener: {
          remove: mockAppStateListenerRemove
        },
        connected: {},
        timeout: undefined,
        initTimeout: undefined,
        _initialized: true,
        approvedHosts: {},
        disabledHosts: {},
        connections: {},
        connecting: {}
      }
    };
  });

  it('should clear the main timeout for other platforms', () => {
    mockInstance.state.timeout = 1;
    mockIsAndroid.mockReturnValue(false);

    unmount(mockInstance);

    expect(spyClearTimeout).toHaveBeenCalledWith(1);
  });

  it('should remove the appStateListener', () => {
    unmount(mockInstance);

    expect(mockAppStateListenerRemove).toHaveBeenCalled();
  });

  describe('Disconnecting all connections', () => {
    it('should disconnect each connected session', () => {
      const mockDisconnect1 = jest.fn();
      const mockDisconnect2 = jest.fn();

      mockInstance.state.connected = {
        '1': {
          disconnect: mockDisconnect1
        },
        '2': {
          disconnect: mockDisconnect2
        }
      };

      unmount(mockInstance);

      expect(mockDisconnect1).toHaveBeenCalled();
      expect(mockDisconnect2).toHaveBeenCalled();
    });
  });

  it('should reset the state properties of the instance', () => {
    mockInstance.state = {
      appStateListener: {
        remove: jest.fn()
      },
      connected: {
        '1': {
          disconnect: jest.fn()
        },
        '2': {
          disconnect: jest.fn()
        }
      },
      timeout: 1,
      initTimeout: 2,
      _initialized: true,
      approvedHosts: {
        '1': 1,
        '2': 1
      },
      disabledHosts: {
        '1': 1,
        '2': 1
      },
      connections: {
        '1': {
          disconnect: jest.fn()
        },
        '2': {
          disconnect: jest.fn()
        }
      },
      connecting: {
        '1': true,
        '2': true
      }
    };

    unmount(mockInstance);

    expect(JSON.stringify(mockInstance.state)).toBe(
      JSON.stringify({
        appStateListener: {
          remove: jest.fn()
        },
        connected: {},
        timeout: undefined,
        initTimeout: undefined,
        _initialized: false,
        approvedHosts: {},
        disabledHosts: {},
        connections: {},
        connecting: {}
      })
    );
  });
});