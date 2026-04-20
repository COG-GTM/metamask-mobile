import React from 'react';
import renderWithProvider from '../../../../../util/test/renderWithProvider';

jest.mock('../../sdk', () => ({
  useRampSDK: () => ({
    appConfig: { POLLING_INTERVAL_HIGHLIGHT: 5_000 },
  }),
}));

// eslint-disable-next-line import/first
import Timer from './Timer';

describe('Timer', () => {
  it('renders a spinner when fetching quotes', () => {
    const { toJSON } = renderWithProvider(
      <Timer
        isFetchingQuotes
        pollingCyclesLeft={0}
        remainingTime={10_000}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the remaining-time label while cycles are left', () => {
    const { toJSON } = renderWithProvider(
      <Timer
        isFetchingQuotes={false}
        pollingCyclesLeft={2}
        remainingTime={20_000}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the expiration label once there are no cycles left', () => {
    const { toJSON } = renderWithProvider(
      <Timer
        isFetchingQuotes={false}
        pollingCyclesLeft={0}
        remainingTime={3_000}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
