import React from 'react';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import { IconColor } from '../../../../../component-library/components/Icons/Icon';
import PulsingCircle from './PulsingCircle';

describe('PulsingCircle', () => {
  it('matches snapshot with primary color', () => {
    const { toJSON } = renderWithProvider(
      <PulsingCircle color={IconColor.Primary} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders with different color variants', () => {
    const { toJSON } = renderWithProvider(
      <PulsingCircle color={IconColor.Success} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with warning color without crashing', () => {
    const { toJSON } = renderWithProvider(
      <PulsingCircle color={IconColor.Warning} />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
