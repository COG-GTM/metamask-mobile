import { NavigationContainerRef } from '@react-navigation/native';
import SDKConnect from '../SDKConnect';
import { wait } from '../utils/wait.util';
import asyncInit from './asyncInit';
import { store } from '../../../store';

jest.mock('@react-navigation/native');
jest.mock('../../../store/storage-wrapper', () => ({
  getItem: jest.fn().mockResolvedValue([]),
  setItem: jest.fn(),
  clearAll: jest.fn().mockResolvedValue([]),
}));
jest.mock('../../AppConstants');
jest.mock('../../../util/Logger');
jest.mock('../SDKConnect');
jest.mock('../utils/DevLogger');
jest.mock('../utils/wait.util');
jest.mock('../../../store', () => ({
  store: {
    getState: jest.fn(() => ({
      sdk: {
        connections: {},
        approvedHosts: {},
      },
    })),
    dispatch: jest.fn(),
  },
}));

describe('asyncInit', () => {
  let mockInstance = {} as unknown as SDKConnect;
  let mockNavigation = {} as unknown as NavigationContainerRef;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInstance = {
      state: {
        navigation: undefined,
        appState: '',
        connections: {},
        approvedHosts: {},
        _initialized: false,
      },
    } as unknown as SDKConnect;

    mockNavigation = {
      /* mock properties and methods as needed */
    } as unknown as NavigationContainerRef;
  });

  it('should set the navigation reference in the instance state', async () => {
    await asyncInit({
      instance: mockInstance,
      navigation: mockNavigation,
    });

    expect(mockInstance.state.navigation).toEqual(mockNavigation);
  });

  it('should set the app state to active', async () => {
    await asyncInit({
      instance: mockInstance,
      navigation: mockNavigation,
    });

    expect(mockInstance.state.appState).toEqual('active');
  });

  it('should wait for a brief period before continuing initialization', async () => {
    await asyncInit({
      instance: mockInstance,
      navigation: mockNavigation,
    });

    expect(wait).toHaveBeenCalledTimes(1);
  });

  describe('Loading connections and hosts from storage', () => {
    it('should parse and set connections from the storage', async () => {
      await asyncInit({
        instance: mockInstance,
        navigation: mockNavigation,
      });

      expect(mockInstance.state.connections).toEqual({});
    });

    it('should check and update approved hosts from the storage', async () => {
      await asyncInit({
        instance: mockInstance,
        navigation: mockNavigation,
      });

      expect(mockInstance.state.approvedHosts).toEqual({});
    });
  });

  it('should set the initialized state to true after successful initialization', async () => {
    await asyncInit({
      instance: mockInstance,
      navigation: mockNavigation,
    });

    expect(mockInstance.state._initialized).toEqual(true);
  });

  it('drops persisted sessions whose id is not a UUID', async () => {
    const validUntil = Date.now() + 60_000;
    (store.getState as jest.Mock).mockReturnValueOnce({
      sdk: {
        connections: {
          '5b3c1a2e-8f4d-4c6b-9a7e-1d2f3a4b5c6d': {
            id: '5b3c1a2e-8f4d-4c6b-9a7e-1d2f3a4b5c6d',
            validUntil,
          },
          'swap.example.org': { id: 'swap.example.org', validUntil },
        },
        approvedHosts: {},
        dappConnections: {
          '5b3c1a2e-8f4d-4c6b-9a7e-1d2f3a4b5c6d': {
            id: '5b3c1a2e-8f4d-4c6b-9a7e-1d2f3a4b5c6d',
            validUntil,
          },
          'swap.example.org': { id: 'swap.example.org', validUntil },
        },
      },
    });

    await asyncInit({
      instance: mockInstance,
      navigation: mockNavigation,
    });

    expect(Object.keys(mockInstance.state.connections)).toEqual([
      '5b3c1a2e-8f4d-4c6b-9a7e-1d2f3a4b5c6d',
    ]);
    expect(Object.keys(mockInstance.state.dappConnections)).toEqual([
      '5b3c1a2e-8f4d-4c6b-9a7e-1d2f3a4b5c6d',
    ]);
  });
});
