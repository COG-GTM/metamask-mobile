import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import GasEducationCarousel from '.';

describe('GasEducationCarousel', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      // @ts-expect-error -- legacy JavaScript UI type boundary
      <GasEducationCarousel
        // @ts-expect-error -- legacy JavaScript UI type boundary
        navigation={{ getParam: () => false, setOptions: () => null }}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
