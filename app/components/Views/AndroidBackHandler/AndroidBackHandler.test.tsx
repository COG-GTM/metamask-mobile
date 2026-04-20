import React from 'react';
import { render } from '@testing-library/react-native';
import AndroidBackHandler from './index';

jest.mock('react-native/Libraries/Interaction/InteractionManager', () => ({
  runAfterInteractions: jest.fn((cb) => {
    cb();
    return { cancel: jest.fn() };
  }),
}));

describe('AndroidBackHandler', () => {
  it('renders null', () => {
    const mockBackPress = jest.fn();
    const { toJSON } = render(
      <AndroidBackHandler customBackPress={mockBackPress} />,
    );
    expect(toJSON()).toBeNull();
  });

  it('accepts customBackPress prop', () => {
    const mockBackPress = jest.fn();
    const { toJSON } = render(
      <AndroidBackHandler customBackPress={mockBackPress} />,
    );
    expect(toJSON()).toBeNull();
    expect(mockBackPress).not.toHaveBeenCalled();
  });

  it('accepts optional navigation prop', () => {
    const mockBackPress = jest.fn();
    const mockNav = { goBack: jest.fn() } as any;
    const { toJSON } = render(
      <AndroidBackHandler customBackPress={mockBackPress} navigation={mockNav} />,
    );
    expect(toJSON()).toBeNull();
  });
});
