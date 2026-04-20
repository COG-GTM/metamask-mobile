import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import { RampType } from '../types';

jest.mock('react-native-modal', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ children, isVisible }: any) =>
    isVisible ? <View>{children}</View> : null;
});

jest.mock('./RegionAlert', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return () => <View />;
});

const mockTrackEvent = jest.fn();
jest.mock('../hooks/useAnalytics', () => () => mockTrackEvent);

// eslint-disable-next-line import/first
import RegionModal from './RegionModal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const regions: any[] = [
  {
    id: '/regions/us',
    name: 'United States',
    emoji: 'US',
    support: { buy: true, sell: true },
    recommended: true,
    unsupported: false,
  },
  {
    id: '/regions/xx',
    name: 'Unsupported Region',
    emoji: 'XX',
    support: { buy: false, sell: false },
    unsupported: true,
    recommended: false,
  },
];

describe('RegionModal', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear();
  });

  it('renders the country list when visible', () => {
    const { getByText, toJSON } = renderWithProvider(
      <RegionModal
        isVisible
        data={regions}
        onRegionPress={jest.fn()}
        selectedRegion={null}
        dismiss={jest.fn()}
        rampType={RampType.BUY}
      />,
    );
    expect(getByText('United States')).toBeDefined();
    expect(getByText('Unsupported Region')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('calls onRegionPress for a supported region', () => {
    const onRegionPress = jest.fn();
    const { getByText } = renderWithProvider(
      <RegionModal
        isVisible
        data={regions}
        onRegionPress={onRegionPress}
        selectedRegion={null}
        dismiss={jest.fn()}
        rampType={RampType.BUY}
      />,
    );
    fireEvent.press(getByText('United States'));
    expect(onRegionPress).toHaveBeenCalledWith(
      expect.objectContaining({ id: '/regions/us' }),
    );
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'RAMP_REGION_SELECTED',
      expect.objectContaining({ country_id: '/regions/us' }),
    );
  });

  it('does not call onRegionPress when an unsupported region is tapped', () => {
    const onRegionPress = jest.fn();
    const { getByText } = renderWithProvider(
      <RegionModal
        isVisible
        data={regions}
        onRegionPress={onRegionPress}
        selectedRegion={null}
        dismiss={jest.fn()}
        rampType={RampType.BUY}
      />,
    );
    fireEvent.press(getByText('Unsupported Region'));
    expect(onRegionPress).not.toHaveBeenCalled();
  });
});
