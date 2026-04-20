// Third party dependencies.
import React from 'react';
import { Text as RNText } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

// Internal dependencies.
import Alert, { AlertType } from './Alert';

describe('Alert', () => {
  it('renders Info alert with string children by default', () => {
    const { getByText, toJSON } = render(
      <Alert type={AlertType.Info}>Info message</Alert>,
    );
    expect(getByText('Info message')).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders Warning and Error types', () => {
    const { rerender, toJSON } = render(
      <Alert type={AlertType.Warning}>Warn</Alert>,
    );
    expect(toJSON()).toBeTruthy();
    rerender(<Alert type={AlertType.Error}>Err</Alert>);
    expect(toJSON()).toBeTruthy();
  });

  it('invokes onPress when wrapped in a TouchableOpacity', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Alert type={AlertType.Info} onPress={onPress}>
        Click me
      </Alert>,
    );
    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('supports a render-children function that receives text styles', () => {
    const renderChildren = jest.fn(() => <RNText>functional child</RNText>);
    const { getByText } = render(
      <Alert type={AlertType.Info}>{renderChildren}</Alert>,
    );
    expect(renderChildren).toHaveBeenCalled();
    expect(getByText('functional child')).toBeTruthy();
  });

  it('renders the icon wrapper when renderIcon is provided', () => {
    const renderIcon = jest.fn(() => <RNText>icon</RNText>);
    const { getByText } = render(
      <Alert type={AlertType.Info} renderIcon={renderIcon}>
        With icon
      </Alert>,
    );
    expect(getByText('icon')).toBeTruthy();
  });
});
