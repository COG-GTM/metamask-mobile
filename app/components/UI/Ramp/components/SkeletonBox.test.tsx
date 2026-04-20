import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import SkeletonBox from './SkeletonBox';

const extraStyle = StyleSheet.create({ spaced: { marginTop: 12 } });

describe('SkeletonBox', () => {
  it('renders with default styles', () => {
    const { toJSON } = render(<SkeletonBox />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('merges additional style prop', () => {
    const { toJSON } = render(<SkeletonBox style={extraStyle.spaced} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
