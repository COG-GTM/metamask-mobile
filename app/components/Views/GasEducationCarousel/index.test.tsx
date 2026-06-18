import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import GasEducationCarousel from '.';

describe('GasEducationCarousel', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <GasEducationCarousel
        navigation={{ setOptions: jest.fn(), pop: jest.fn(), navigate: jest.fn() }}
        route={{ params: {} }}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
