import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import renderWithProvider from '../../../../util/test/renderWithProvider';

jest.mock('react-native-modal', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ children, isVisible }: any) =>
    isVisible ? <View>{children}</View> : null;
});

// eslint-disable-next-line import/first
import InfoAlert from './InfoAlert';

jest.mock('../hooks/useAnalytics', () => () => jest.fn());

jest.mock('../../../Base/RemoteImage', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const { Image } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (props: any) => <Image {...props} />;
});

describe('InfoAlert', () => {
  it('renders the provider name when no logos are provided', () => {
    const { getByText, toJSON } = renderWithProvider(
      <InfoAlert
        isVisible
        providerName="Test Provider"
        subtitle="subtitle"
        body="some body text"
      />,
    );
    expect(getByText('Test Provider')).toBeDefined();
    expect(getByText('subtitle')).toBeDefined();
    expect(getByText('some body text')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('opens the provider homepage when the link is pressed', () => {
    const openURLSpy = jest
      .spyOn(Linking, 'openURL')
      .mockImplementation(() => Promise.resolve());
    const { getByText } = renderWithProvider(
      <InfoAlert
        isVisible
        providerName="Test Provider"
        providerWebsite="https://example.com"
      />,
    );
    fireEvent.press(getByText('https://example.com'));
    expect(openURLSpy).toHaveBeenCalledWith('https://example.com');
    openURLSpy.mockRestore();
  });

  it('invokes the dismiss callback when the close button is pressed', () => {
    const dismiss = jest.fn();
    const { UNSAFE_getAllByType } = renderWithProvider(
      <InfoAlert isVisible providerName="Test Provider" dismiss={dismiss} />,
    );
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const { TouchableOpacity } = require('react-native');
    const pressables = UNSAFE_getAllByType(TouchableOpacity).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (node: any) => typeof node.props.onPress === 'function',
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pressables.forEach((node: any) => fireEvent.press(node));
    expect(dismiss).toHaveBeenCalled();
  });
});
