import React from 'react';
import { render } from '@testing-library/react-native';
import { BannerAlertSeverity } from '../../../component-library/components/Banners/Banner';
import { SnapUIBanner } from './SnapUIBanner';
import { Text } from 'react-native';

describe('SnapUIBanner', () => {
  it('renders the title and children', () => {
    const { getByText } = render(
      <SnapUIBanner severity={BannerAlertSeverity.Info} title="Heads up">
        <Text>Hello there</Text>
      </SnapUIBanner>,
    );

    expect(getByText('Heads up')).toBeTruthy();
    expect(getByText('Hello there')).toBeTruthy();
  });

  it('matches snapshot for danger severity without children', () => {
    const { toJSON } = render(
      <SnapUIBanner severity={BannerAlertSeverity.Danger} title="Boom" />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('does not fail when severity is undefined', () => {
    const { getByText } = render(
      <SnapUIBanner title="Just info">
        <Text>body</Text>
      </SnapUIBanner>,
    );
    expect(getByText('Just info')).toBeTruthy();
  });
});
