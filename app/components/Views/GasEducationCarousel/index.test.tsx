import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import GasEducationCarousel from '.';

const GasEducationCarouselForTest = GasEducationCarousel as React.ComponentType<
  Partial<React.ComponentProps<typeof GasEducationCarousel>>
>;

describe('GasEducationCarousel', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <GasEducationCarouselForTest
        navigation={{ getParam: () => false, setOptions: () => null } as never}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
