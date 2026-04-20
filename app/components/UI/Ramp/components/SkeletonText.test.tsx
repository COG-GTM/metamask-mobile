import React from 'react';
import { render } from '@testing-library/react-native';
import SkeletonText from './SkeletonText';

describe('SkeletonText', () => {
  it('renders with default styles', () => {
    const { toJSON } = render(<SkeletonText />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('applies every supported size and spacing variant without crashing', () => {
    const { toJSON } = render(
      <SkeletonText
        thin
        thick
        large
        medium
        small
        smaller
        center
        spacingVertical
        spacingHorizontal
        spacingBottom
        spacingTop
        spacingTopSmall
        title
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
