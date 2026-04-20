import React from 'react';
import { render } from '@testing-library/react-native';

import SkeletonComponent from './skeletonComponent';

describe('SkeletonComponent', () => {
  it('matches snapshot with default styling', () => {
    const { toJSON } = render(<SkeletonComponent width={120} noStyle={false} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('matches snapshot when noStyle is true', () => {
    const { toJSON } = render(<SkeletonComponent width={60} noStyle />);
    expect(toJSON()).toMatchSnapshot();
  });
});
