import React from 'react';
import { render } from '@testing-library/react-native';
import DownChevronText from './DownChevronText';

describe('DownChevronText', () => {
  it('renders the provided text', () => {
    const { getByText, toJSON } = render(<DownChevronText text="USD" />);
    expect(getByText('USD')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders without text', () => {
    const { toJSON } = render(<DownChevronText />);
    expect(toJSON()).toMatchSnapshot();
  });
});
