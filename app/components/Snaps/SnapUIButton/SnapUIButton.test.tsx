import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { ButtonType, UserInputEventType } from '@metamask/snaps-sdk';
import { SnapUIButton } from './SnapUIButton';
import { useSnapInterfaceContext } from '../SnapInterfaceContext';

jest.mock('../SnapInterfaceContext');

describe('SnapUIButton', () => {
  const handleEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSnapInterfaceContext as jest.Mock).mockReturnValue({ handleEvent });
  });

  it('renders children by default', () => {
    const { getByText } = render(
      <SnapUIButton name="btn">
        <Text>Click me</Text>
      </SnapUIButton>,
    );
    expect(getByText('Click me')).toBeTruthy();
  });

  it('fires a ButtonClickEvent when pressed', () => {
    const { getByText } = render(
      <SnapUIButton name="btn">
        <Text>Click me</Text>
      </SnapUIButton>,
    );
    fireEvent.press(getByText('Click me'));
    expect(handleEvent).toHaveBeenCalledWith({
      event: UserInputEventType.ButtonClickEvent,
      name: 'btn',
    });
  });

  it('also fires a FormSubmitEvent when the button type is Submit', () => {
    const { getByText } = render(
      <SnapUIButton name="btn" type={ButtonType.Submit} form="myForm">
        <Text>Go</Text>
      </SnapUIButton>,
    );
    fireEvent.press(getByText('Go'));
    expect(handleEvent).toHaveBeenCalledWith({
      event: UserInputEventType.ButtonClickEvent,
      name: 'btn',
    });
    expect(handleEvent).toHaveBeenCalledWith({
      event: UserInputEventType.FormSubmitEvent,
      name: 'myForm',
    });
  });

  it('renders a loading indicator when loading is true and hides children', () => {
    const { queryByText } = render(
      <SnapUIButton name="btn" loading>
        <Text>Hidden</Text>
      </SnapUIButton>,
    );
    expect(queryByText('Hidden')).toBeNull();
  });

  it('renders its children when disabled and not loading', () => {
    const { getByText } = render(
      <SnapUIButton name="btn" disabled>
        <Text>Nope</Text>
      </SnapUIButton>,
    );
    expect(getByText('Nope')).toBeTruthy();
  });
});
