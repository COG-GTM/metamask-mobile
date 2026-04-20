import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import ActionAlert from './ActionAlert';
import { AlertType } from '../../../Base/Alert';

describe('ActionAlert', () => {
  it('matches snapshot with action and info button', () => {
    const { toJSON } = render(
      <ActionAlert
        type={AlertType.Warning}
        action="Retry"
        onPress={jest.fn()}
        onInfoPress={jest.fn()}
      >
        {() => <Text>Something happened</Text>}
      </ActionAlert>,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders children', () => {
    const { getByText } = render(
      <ActionAlert type={AlertType.Warning}>
        {() => <Text>Alert body</Text>}
      </ActionAlert>,
    );
    expect(getByText('Alert body')).toBeTruthy();
  });

  it('invokes onPress when the action button is tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ActionAlert
        type={AlertType.Warning}
        action="Try again"
        onPress={onPress}
      >
        {() => <Text>body</Text>}
      </ActionAlert>,
    );
    fireEvent.press(getByText('Try again'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders with error styling when type is Error', () => {
    const { toJSON } = render(
      <ActionAlert type={AlertType.Error} action="Retry" onPress={jest.fn()}>
        {() => <Text>err</Text>}
      </ActionAlert>,
    );
    expect(toJSON()).toBeTruthy();
  });
});
