import { Platform } from 'react-native';
import init from './init';
import asyncInit from './asyncInit';
import AndroidService from '../AndroidSDK/AndroidService';
import DeeplinkProtocolService from '../SDKDeeplinkProtocol/DeeplinkProtocolService';

jest.mock('./asyncInit', () => jest.fn());
jest.mock('../AndroidSDK/AndroidService', () =>
  jest.fn().mockImplementation(() => ({ kind: 'android-service' })),
);
jest.mock('../SDKDeeplinkProtocol/DeeplinkProtocolService', () =>
  jest.fn().mockImplementation(() => ({ kind: 'deeplink-service' })),
);
jest.mock('../utils/DevLogger', () => ({
  __esModule: true,
  default: { log: jest.fn() },
}));
jest.mock('../SDKConnect', () => ({ __esModule: true, default: {} }));

const asyncInitMock = asyncInit as jest.Mock;

describe('SDKConnect init', () => {
  const makeInstance = () => ({
    state: {
      _initializing: undefined as Promise<unknown> | undefined,
      _initialized: false,
      connections: {},
      androidSDKStarted: false,
      deeplinkingServiceStarted: false,
      androidService: undefined,
      deeplinkingService: undefined,
    },
  });

  beforeEach(() => {
    asyncInitMock.mockReset().mockResolvedValue(undefined);
    (AndroidService as unknown as jest.Mock).mockClear();
    (DeeplinkProtocolService as unknown as jest.Mock).mockClear();
  });

  it('returns an existing _initializing promise when already initializing', async () => {
    const instance = makeInstance();
    const existing = Promise.resolve('existing');
    instance.state._initializing = existing;

    const result = await init({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation: {} as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      instance: instance as any,
    });
    expect(result).toBe('existing');
    expect(asyncInitMock).not.toHaveBeenCalled();
  });

  it('short-circuits when already initialized', async () => {
    const instance = makeInstance();
    instance.state._initialized = true;

    const result = await init({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation: {} as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      instance: instance as any,
    });
    expect(result).toBeUndefined();
    expect(asyncInitMock).not.toHaveBeenCalled();
  });

  it('starts the Android service on android and delegates to asyncInit', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', writable: true });
    const instance = makeInstance();

    await init({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation: {} as any,
      context: 'test',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      instance: instance as any,
    });

    expect(AndroidService).toHaveBeenCalledTimes(1);
    expect(instance.state.androidSDKStarted).toBe(true);
    expect(instance.state.androidService).toEqual({ kind: 'android-service' });
    expect(asyncInitMock).toHaveBeenCalledTimes(1);
  });

  it('starts the deeplink service on iOS and delegates to asyncInit', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true });
    const instance = makeInstance();

    await init({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation: {} as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      instance: instance as any,
    });

    expect(DeeplinkProtocolService).toHaveBeenCalledTimes(1);
    expect(instance.state.deeplinkingServiceStarted).toBe(true);
    expect(instance.state.deeplinkingService).toEqual({
      kind: 'deeplink-service',
    });
    expect(asyncInitMock).toHaveBeenCalledTimes(1);
  });

  it('skips starting the Android service when already started on android', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', writable: true });
    const instance = makeInstance();
    instance.state.androidSDKStarted = true;

    await init({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation: {} as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      instance: instance as any,
    });

    expect(AndroidService).not.toHaveBeenCalled();
    expect(asyncInitMock).toHaveBeenCalledTimes(1);
  });
});
