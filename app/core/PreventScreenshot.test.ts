import { NativeModules, Platform } from 'react-native';
import Logger from '../util/Logger';
import trackErrorAsAnalytics from '../util/metrics/TrackError/trackErrorAsAnalytics';
import PreventScreenshot from './PreventScreenshot';

jest.mock('../util/Logger', () => ({
  error: jest.fn(),
}));
jest.mock('../util/metrics/TrackError/trackErrorAsAnalytics', () => jest.fn());

describe('PreventScreenshot', () => {
  const nativeForbid = jest.fn();
  const nativeAllow = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (trackErrorAsAnalytics as jest.Mock).mockResolvedValue(undefined);
    Platform.OS = 'android';
    NativeModules.PreventScreenshot = {
      forbid: nativeForbid,
      allow: nativeAllow,
    };
  });

  afterAll(() => {
    Platform.OS = 'ios';
  });

  it('resolves true when the native module applies FLAG_SECURE', async () => {
    nativeForbid.mockResolvedValue('Done. Screenshot taking locked.');

    await expect(PreventScreenshot.forbid('Onboarding')).resolves.toBe(true);
    expect(nativeForbid).toHaveBeenCalled();
    expect(Logger.error).not.toHaveBeenCalled();
    expect(trackErrorAsAnalytics).not.toHaveBeenCalled();
  });

  it.each(['forbid', 'allow'] as const)(
    'reports %s failures to Sentry and analytics',
    async (action) => {
      const error = new Error('no current activity');
      (action === 'forbid' ? nativeForbid : nativeAllow).mockRejectedValue(
        error,
      );

      await expect(
        PreventScreenshot[action]('ScreenshotDeterrent'),
      ).resolves.toBe(false);

      expect(Logger.error).toHaveBeenCalledWith(error, {
        message: `PreventScreenshot.${action} failed`,
        location: 'ScreenshotDeterrent',
      });
      expect(trackErrorAsAnalytics).toHaveBeenCalledWith(
        `PreventScreenshot ${action} failed`,
        'no current activity',
        'ScreenshotDeterrent',
      );
    },
  );

  it('normalizes non-Error rejections from the bridge', async () => {
    nativeForbid.mockRejectedValue({ message: 'bridge failure' });

    await expect(PreventScreenshot.forbid()).resolves.toBe(false);

    expect(Logger.error).toHaveBeenCalledWith(new Error('bridge failure'), {
      message: 'PreventScreenshot.forbid failed',
      location: 'unknown',
    });
  });

  it('contains analytics reporting failures', async () => {
    nativeForbid.mockRejectedValue(new Error('no current activity'));
    (trackErrorAsAnalytics as jest.Mock).mockRejectedValue(
      new Error('metrics id unavailable'),
    );

    await expect(PreventScreenshot.forbid('Onboarding')).resolves.toBe(false);
    await Promise.resolve();

    expect(Logger.error).toHaveBeenCalledWith(
      new Error('metrics id unavailable'),
      { message: 'PreventScreenshot.forbid failure reporting failed' },
    );
  });

  it('is a no-op on iOS', async () => {
    Platform.OS = 'ios';

    await expect(PreventScreenshot.forbid()).resolves.toBe(true);
    expect(nativeForbid).not.toHaveBeenCalled();
  });
});
