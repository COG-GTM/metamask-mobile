import React from 'react';
import { render } from '@testing-library/react-native';
import SkeletonQuote from './SkeletonQuote';

describe('SkeletonQuote', () => {
  it('renders the expanded layout by default', () => {
    const { toJSON } = render(<SkeletonQuote />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders a reduced layout when `collapsed` is set', () => {
    const { toJSON } = render(<SkeletonQuote collapsed />);
    expect(toJSON()).toMatchSnapshot();
  });
});
