import React from 'react';
import { render } from '@testing-library/react-native';
import Overlay from './Overlay';

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    useSafeAreaInsets: jest.fn().mockImplementation(() => inset),
  };
});

describe('Overlay', () => {
  it('renders correctly', () => {
    const { toJSON } = render(<Overlay onPress={jest.fn()} />);
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<Overlay onPress={jest.fn()} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
