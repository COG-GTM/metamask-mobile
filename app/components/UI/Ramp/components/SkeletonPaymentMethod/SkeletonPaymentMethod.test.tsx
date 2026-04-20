import React from 'react';
import { render } from '@testing-library/react-native';
import SkeletonPaymentMethod from './SkeletonPaymentMethod';

describe('SkeletonPaymentMethod', () => {
  it('renders a static skeleton layout', () => {
    const { toJSON } = render(<SkeletonPaymentMethod />);
    expect(toJSON()).toMatchSnapshot();
  });
});
