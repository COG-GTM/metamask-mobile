import React from 'react';
import { render } from '@testing-library/react-native';
import UnstakingBanner from './UnstakeBanner';

describe('UnstakingBanner', () => {
  it('renders the banner with a countdown message and matches snapshot', () => {
    const { getByTestId, toJSON } = render(
      <UnstakingBanner
        timeRemaining={{ days: 1, hours: 2, minutes: 0 }}
        amountEth="0.5"
      />,
    );

    expect(getByTestId('unstaking-banner')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the default copy when days, hours and minutes are all zero', () => {
    const { getByTestId } = render(
      <UnstakingBanner
        timeRemaining={{ days: 0, hours: 0, minutes: 0 }}
        amountEth="0.1"
      />,
    );

    expect(getByTestId('unstaking-banner')).toBeDefined();
  });
});
