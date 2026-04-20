import React from 'react';
import { render } from '@testing-library/react-native';
import NetworkFeeFieldSkeleton from './NetworkFeeField';

describe('NetworkFeeFieldSkeleton', () => {
  it('renders correctly', () => {
    const { toJSON } = render(<NetworkFeeFieldSkeleton />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders without crashing and returns a truthy tree', () => {
    const { toJSON } = render(<NetworkFeeFieldSkeleton />);
    expect(toJSON()).toBeTruthy();
  });
});
