/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-shadow, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unused-vars, import/no-commonjs, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
const SlippageSlider: any = require('./index').default;

describe('SlippageSlider', () => {
  it('should render correctly', () => {
    render(
      <SlippageSlider
        range={[1, 5]}
        increment={1}
        onChange={() => undefined}
        formatTooltipText={(text: any) => `${text}%`}
      />,
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
