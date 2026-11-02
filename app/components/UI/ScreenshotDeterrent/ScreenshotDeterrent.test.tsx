import React from 'react';
import { act } from '@testing-library/react-native';
import { AppState, AppStateStatus, Platform } from 'react-native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import ScreenshotDeterrent, {
  SCREENSHOT_DETERRENT_PRIVACY_OVERLAY_TEST_ID,
} from './ScreenshotDeterrent';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
  useFocusEffect: jest.fn(),
}));

jest.mock('../../../core/PreventScreenshot', () => ({
  forbid: jest.fn(),
  allow: jest.fn(),
}));

jest.mock('../../../components/hooks/useMetrics', () => ({
  useMetrics: () => ({
    trackEvent: jest.fn(),
    createEventBuilder: () => ({ build: jest.fn() }),
  }),
}));

describe('ScreenshotDeterrent', () => {
  const originalOS = Platform.OS;
  let appStateListener: ((state: AppStateStatus) => void) | undefined;
  const removeSubscription = jest.fn();

  beforeEach(() => {
    appStateListener = undefined;
    removeSubscription.mockClear();
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_type, listener) => {
        appStateListener = listener as (state: AppStateStatus) => void;
        return { remove: removeSubscription } as ReturnType<
          typeof AppState.addEventListener
        >;
      });
    Object.defineProperty(AppState, 'currentState', {
      value: 'active',
      configurable: true,
    });
  });

  afterEach(() => {
    Platform.OS = originalOS;
    jest.restoreAllMocks();
  });

  const setAppState = (state: AppStateStatus) =>
    act(() => {
      appStateListener?.(state);
    });

  it.each([true, false])(
    'covers the secret on iOS when the app resigns active (hasNavigation=%s)',
    (hasNavigation) => {
      Platform.OS = 'ios';
      const { queryByTestId } = renderWithProvider(
        <ScreenshotDeterrent enabled isSRP hasNavigation={hasNavigation} />,
      );

      expect(
        queryByTestId(SCREENSHOT_DETERRENT_PRIVACY_OVERLAY_TEST_ID),
      ).toBeNull();

      setAppState('inactive');
      expect(
        queryByTestId(SCREENSHOT_DETERRENT_PRIVACY_OVERLAY_TEST_ID),
      ).not.toBeNull();

      setAppState('background');
      expect(
        queryByTestId(SCREENSHOT_DETERRENT_PRIVACY_OVERLAY_TEST_ID),
      ).not.toBeNull();

      setAppState('active');
      expect(
        queryByTestId(SCREENSHOT_DETERRENT_PRIVACY_OVERLAY_TEST_ID),
      ).toBeNull();
    },
  );

  it('does not cover the screen when the deterrent is disabled', () => {
    Platform.OS = 'ios';
    const { queryByTestId } = renderWithProvider(
      <ScreenshotDeterrent enabled={false} isSRP />,
    );

    setAppState('inactive');
    expect(
      queryByTestId(SCREENSHOT_DETERRENT_PRIVACY_OVERLAY_TEST_ID),
    ).toBeNull();
  });

  it('removes the AppState subscription on unmount', () => {
    Platform.OS = 'ios';
    const { unmount } = renderWithProvider(
      <ScreenshotDeterrent enabled isSRP />,
    );
    unmount();
    expect(removeSubscription).toHaveBeenCalled();
  });

  it('does not render the overlay on Android (FLAG_SECURE handles it)', () => {
    Platform.OS = 'android';
    const { queryByTestId } = renderWithProvider(
      <ScreenshotDeterrent enabled isSRP />,
    );

    setAppState('background');
    expect(
      queryByTestId(SCREENSHOT_DETERRENT_PRIVACY_OVERLAY_TEST_ID),
    ).toBeNull();
  });
});
