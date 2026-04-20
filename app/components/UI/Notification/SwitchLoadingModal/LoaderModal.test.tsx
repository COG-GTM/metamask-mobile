import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';
import LoaderModal from './LoaderModal';

jest.mock('react-native-modal', () => {
  const ReactModule = jest.requireActual('react');
  const RN = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({
      isVisible,
      children,
    }: {
      isVisible: boolean;
      children: React.ReactNode;
    }) =>
      isVisible
        ? ReactModule.createElement(
            RN.View,
            { testID: 'react-native-modal' },
            children,
          )
        : null,
  };
});

describe('LoaderModal', () => {
  it('renders correctly when visible', () => {
    const { toJSON } = render(
      <LoaderModal isVisible onCancel={jest.fn()}>
        <View testID="child">
          <Text>Inner</Text>
        </View>
      </LoaderModal>,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders its children when isVisible is true', () => {
    const { getByTestId } = render(
      <LoaderModal isVisible onCancel={jest.fn()}>
        <View testID="child" />
      </LoaderModal>,
    );
    expect(getByTestId('child')).toBeDefined();
  });

  it('does not render children when isVisible is false', () => {
    const { queryByTestId } = render(
      <LoaderModal isVisible={false} onCancel={jest.fn()}>
        <View testID="child" />
      </LoaderModal>,
    );
    expect(queryByTestId('child')).toBeNull();
  });
});
