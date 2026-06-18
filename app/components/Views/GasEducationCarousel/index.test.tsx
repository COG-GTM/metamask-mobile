import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import GasEducationCarousel from '.';

describe('GasEducationCarousel', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <GasEducationCarousel
        navigation={
          {
            getParam: () => false,
            setOptions: () => null,
          } as unknown as React.ComponentProps<
            typeof GasEducationCarousel
          >['navigation']
        }
        route={
          { params: {} } as unknown as React.ComponentProps<
            typeof GasEducationCarousel
          >['route']
        }
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
