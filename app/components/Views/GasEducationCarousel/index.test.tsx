import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import GasEducationCarouselBase from '.';

const GasEducationCarousel =
  GasEducationCarouselBase as unknown as React.ComponentType<
    Record<string, unknown>
  >;

describe('GasEducationCarousel', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <GasEducationCarousel
        navigation={{ getParam: () => false, setOptions: () => null }}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
