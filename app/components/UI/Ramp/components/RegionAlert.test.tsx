import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { Linking, TouchableOpacity } from 'react-native';
import renderWithProvider from '../../../../util/test/renderWithProvider';

jest.mock('react-native-modal', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ children, isVisible }: any) =>
    isVisible ? <View>{children}</View> : null;
});

// eslint-disable-next-line import/first
import RegionAlert from './RegionAlert';

describe('RegionAlert', () => {
  it('renders the title, subtitle, body, and link', () => {
    const { getByText, toJSON } = renderWithProvider(
      <RegionAlert
        isVisible
        title="Unsupported"
        subtitle="Sorry"
        body="Your region is not supported"
        link="Learn more"
      />,
    );
    expect(getByText('Unsupported')).toBeDefined();
    expect(getByText('Sorry')).toBeDefined();
    expect(getByText('Your region is not supported')).toBeDefined();
    expect(getByText('Learn more')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('opens the support URL when the link is pressed', () => {
    const openURLSpy = jest
      .spyOn(Linking, 'openURL')
      .mockImplementation(() => Promise.resolve());
    const { getByText } = renderWithProvider(
      <RegionAlert isVisible title="t" subtitle="s" body="b" link="Learn more" />,
    );
    fireEvent.press(getByText('Learn more'));
    expect(openURLSpy).toHaveBeenCalledWith(expect.stringContaining('support'));
    openURLSpy.mockRestore();
  });

  it('invokes the dismiss callback when the close button is pressed', () => {
    const dismiss = jest.fn();
    const openURLSpy = jest
      .spyOn(Linking, 'openURL')
      .mockImplementation(() => Promise.resolve());
    const { UNSAFE_getAllByType } = renderWithProvider(
      <RegionAlert isVisible title="t" subtitle="s" body="b" link="l" dismiss={dismiss} />,
    );
    const pressables = UNSAFE_getAllByType(TouchableOpacity).filter(
      (node) => typeof node.props.onPress === 'function',
    );
    pressables.forEach((node) => fireEvent.press(node));
    expect(dismiss).toHaveBeenCalled();
    openURLSpy.mockRestore();
  });
});
