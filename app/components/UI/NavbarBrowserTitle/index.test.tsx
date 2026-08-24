import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import NavbarBrowserTitle from './';
import { backgroundState } from '../../../util/test/initial-root-state';

const mockInitialState = {
  engine: {
    backgroundState,
  },
};

describe('NavbarBrowserTitle', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <NavbarBrowserTitle
        {...({
          hostname: 'faucet.metamask.io',
          https: true,
        } as unknown as React.ComponentProps<typeof NavbarBrowserTitle>)}
      />,
      { state: mockInitialState },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
