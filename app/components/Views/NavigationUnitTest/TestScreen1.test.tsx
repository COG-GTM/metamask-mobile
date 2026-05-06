/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- TS migration cleanup follow-up: fully type this file
import React from 'react';
import NavigationUnitTest from '.';
import { render } from '@testing-library/react-native';

describe('NavigationUnitTest', () => {
  it('should render correctly', () => {
    const { toJSON } = render(
      <NavigationUnitTest firstRoute={'TestScreen1'} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
