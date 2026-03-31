import React from 'react';
import { render, screen } from '@testing-library/react-native';
import SlippageSlider from './index';

describe('SlippageSlider', () => {
  it('should render correctly', () => {
    render(
      // @ts-expect-error Legacy JS code needs type refinement
      <SlippageSlider
        range={[1, 5]}
        increment={1}
        onChange={() => undefined}
        formatTooltipText={(text) => `${text}%`}
      />,
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
