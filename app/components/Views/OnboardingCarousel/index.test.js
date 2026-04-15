import React from 'react';
import { waitFor } from '@testing-library/react-native';
import OnboardingCarousel from './';

import { OnboardingCarouselSelectorIDs } from '../../../../e2e/selectors/Onboarding/OnboardingCarousel.selectors';
import renderWithProvider from '../../../util/test/renderWithProvider';
import Device from '../../../util/device';

jest.mock('../../../util/metrics/TrackOnboarding/trackOnboarding');
jest.mock('../../../util/test/utils', () => ({
  isTest: true
}));

jest.mock('../../../util/device', () => ({
  isAndroid: jest.fn(),
  isIphoneX: jest.fn(),
  isIphone5S: jest.fn(),
  isIos: jest.fn()
}));

const mockNavigate = jest.fn();
const mockSetOptions = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  setOptions: mockSetOptions
};

describe('OnboardingCarousel', () => {
  beforeEach(() => {
    Device.isAndroid.mockReset();
    Device.isIphoneX.mockReset();
    Device.isIphone5S.mockReset();
    Device.isIos.mockReset();

    Device.isAndroid.mockReturnValue(false);
    Device.isIphoneX.mockReturnValue(false);
    Device.isIphone5S.mockReturnValue(false);
    Device.isIos.mockReturnValue(true);
  });

  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <OnboardingCarousel navigation={mockNavigation} />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should render the App Start Time text when isTest is true', async () => {
    const { toJSON, getByTestId } = renderWithProvider(
      <OnboardingCarousel navigation={mockNavigation} />
    );
    expect(toJSON()).toMatchSnapshot();

    await waitFor(() => {
      expect(
        getByTestId(OnboardingCarouselSelectorIDs.APP_START_TIME_ID)
      ).toBeTruthy();
    });
  });

  describe('Image Padding', () => {
    it('should use iPhone X padding', () => {
      Device.isAndroid.mockReturnValue(false);
      Device.isIphoneX.mockReturnValue(true);
      Device.isIos.mockReturnValue(true);

      const { toJSON } = renderWithProvider(
        <OnboardingCarousel navigation={mockNavigation} />
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should use iPhone 5S padding', () => {
      Device.isAndroid.mockReturnValue(false);
      Device.isIphoneX.mockReturnValue(false);
      Device.isIphone5S.mockReturnValue(true);
      Device.isIos.mockReturnValue(true);

      const { toJSON } = renderWithProvider(
        <OnboardingCarousel navigation={mockNavigation} />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });
});