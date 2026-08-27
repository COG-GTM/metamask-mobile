import React from 'react';
import { render } from '@testing-library/react-native';
import CustomNonce from '.';

describe('CustomNonce', () => {
  it('should render correctly', () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { toJSON } = render(<CustomNonce />);
    expect(toJSON()).toMatchSnapshot();
  });
});
