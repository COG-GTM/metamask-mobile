import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import GasEducationCarousel from '.';

type GasEducationCarouselProps = React.ComponentProps<
  typeof GasEducationCarousel
>;

describe('GasEducationCarousel', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <GasEducationCarousel
        navigation={
          {
            getParam: () => false,
            setOptions: () => null,
          } as unknown as GasEducationCarouselProps['navigation']
        }
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
