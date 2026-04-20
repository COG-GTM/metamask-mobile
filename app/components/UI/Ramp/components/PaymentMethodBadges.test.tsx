import React from 'react';
import { Image } from 'react-native';
import { render } from '@testing-library/react-native';
import PaymentMethodBadges from './PaymentMethodBadges';

jest.mock('../../../../util/theme', () => ({
  ...jest.requireActual('../../../../util/theme'),
  useTheme: jest
    .fn()
    .mockReturnValue({ themeAppearance: 'light', colors: {} }),
}));

jest.mock('../../../Base/RemoteImage', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const { Image: MockedImage } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (props: any) => <MockedImage {...props} />;
});

type LogosByTheme = React.ComponentProps<
  typeof PaymentMethodBadges
>['logosByTheme'];

describe('PaymentMethodBadges', () => {
  it('renders a remote image for every URL in the active theme bucket', () => {
    const logosByTheme = {
      light: ['light-1.png', 'light-2.png'],
      dark: ['dark-1.png', 'dark-2.png'],
    } as unknown as LogosByTheme;
    const { toJSON, UNSAFE_getAllByType } = render(
      <PaymentMethodBadges logosByTheme={logosByTheme} />,
    );
    expect(UNSAFE_getAllByType(Image).length).toBeGreaterThan(0);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders nothing when the active theme bucket is empty', () => {
    const logosByTheme = {
      light: [],
      dark: [],
    } as unknown as LogosByTheme;
    const { toJSON, UNSAFE_queryAllByType } = render(
      <PaymentMethodBadges logosByTheme={logosByTheme} />,
    );
    expect(UNSAFE_queryAllByType(Image)).toHaveLength(0);
    expect(toJSON()).toMatchSnapshot();
  });
});
