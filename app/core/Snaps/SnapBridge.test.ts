// eslint-disable-next-line import/no-nodejs-modules
import { Duplex } from 'stream';

jest.mock('./SnapsMethodMiddleware', () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn()),
}));

jest.mock('../../util/streams', () => ({
  setupMultiplex: jest.fn(() => ({ createStream: jest.fn() })),
}));

jest.mock('../../util/Logger', () => ({
  __esModule: true,
  default: { log: jest.fn() },
}));

import Engine from '../Engine';
import SnapBridge from './SnapBridge';

const mockGetProviderAndBlockTracker = jest.fn();
const mockIsUnlocked = jest.fn();
const mockCall = jest.fn();

describe('SnapBridge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProviderAndBlockTracker.mockReturnValue({
      provider: { id: 'provider' },
      blockTracker: { id: 'blockTracker', on: jest.fn() },
    });
    mockIsUnlocked.mockReturnValue(true);

    (Engine.context as unknown as {
      NetworkController: { getProviderAndBlockTracker: jest.Mock };
    }).NetworkController = {
      getProviderAndBlockTracker: mockGetProviderAndBlockTracker,
    };
    (Engine.context as unknown as {
      KeyringController: { isUnlocked: jest.Mock };
    }).KeyringController = { isUnlocked: mockIsUnlocked };
    (Engine.context as unknown as {
      PermissionController: { createPermissionMiddleware: jest.Mock };
    }).PermissionController = {
      createPermissionMiddleware: jest.fn(() => jest.fn()),
    };
    (Engine as unknown as { controllerMessenger: { call: jest.Mock } })
      .controllerMessenger = { call: mockCall };
  });

  const makeBridge = () => {
    const connectionStream = new Duplex({
      read() {
        // no-op
      },
      write(_chunk, _enc, cb) {
        cb?.();
      },
    });
    const getRPCMethodMiddleware = jest.fn(() => jest.fn());
    return new SnapBridge({
      snapId: 'npm:@metamask/example-snap',
      connectionStream,
      getRPCMethodMiddleware,
    });
  };

  it('constructs and stores the snapId, stream, and provider', () => {
    const bridge = makeBridge();

    expect(bridge.snapId).toBe('npm:@metamask/example-snap');
    expect(bridge.provider).toEqual({ id: 'provider' });
    expect(mockGetProviderAndBlockTracker).toHaveBeenCalled();
  });

  it('isUnlocked proxies to the KeyringController', () => {
    const bridge = makeBridge();
    expect(bridge.isUnlocked()).toBe(true);
    mockIsUnlocked.mockReturnValue(false);
    expect(bridge.isUnlocked()).toBe(false);
  });

  it('getProviderNetworkState returns chainId and network version', async () => {
    mockCall.mockImplementation((action: string) => {
      if (action === 'SelectedNetworkController:getNetworkClientIdForDomain') {
        return 'mainnet';
      }
      if (action === 'NetworkController:getNetworkClientById') {
        return {
          configuration: { chainId: '0x1' },
          provider: {
            sendAsync: (
              _req: unknown,
              cb: (err: unknown, res: unknown) => void,
            ) => cb(null, { result: '1' }),
          },
        };
      }
      return undefined;
    });

    const bridge = makeBridge();
    const state = await bridge.getProviderNetworkState(bridge.snapId);
    expect(state).toEqual({ chainId: '0x1', networkVersion: '1' });
  });

  it('getProviderState composes isUnlocked with provider network state', async () => {
    mockCall.mockImplementation((action: string) => {
      if (action === 'SelectedNetworkController:getNetworkClientIdForDomain') {
        return 'mainnet';
      }
      if (action === 'NetworkController:getNetworkClientById') {
        return {
          configuration: { chainId: '0x1' },
          provider: {
            sendAsync: (
              _req: unknown,
              cb: (err: unknown, res: unknown) => void,
            ) => cb(null, { result: '1' }),
          },
        };
      }
      return undefined;
    });

    const bridge = makeBridge();
    const state = await bridge.getProviderState();
    expect(state).toEqual({
      isUnlocked: true,
      chainId: '0x1',
      networkVersion: '1',
    });
  });

  it('getProviderNetworkState reports "loading" when net_version errors', async () => {
    mockCall.mockImplementation((action: string) => {
      if (action === 'SelectedNetworkController:getNetworkClientIdForDomain') {
        return 'mainnet';
      }
      if (action === 'NetworkController:getNetworkClientById') {
        return {
          configuration: { chainId: '0x1' },
          provider: {
            sendAsync: (
              _req: unknown,
              cb: (err: unknown, res: unknown) => void,
            ) => cb(new Error('boom'), null),
          },
        };
      }
      return undefined;
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      // no-op
    });
    const bridge = makeBridge();
    const state = await bridge.getProviderNetworkState(bridge.snapId);
    expect(state).toEqual({ chainId: '0x1', networkVersion: 'loading' });
    consoleSpy.mockRestore();
  });
});
