import React from 'react';
import renderWithProvider from '../../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../../util/test/initial-root-state';
import AutoLock from './AutoLock';
import { AUTO_LOCK_SECTION } from './constants';
import { fireEvent } from '@testing-library/react-native';
import { setLockTime } from '../../../../../../actions/settings';

jest.mock('../../../../../../actions/settings', () => ({
  setLockTime: jest.fn((time: number) => ({
    type: 'SET_LOCK_TIME',
    lockTime: time,
  })),
}));

jest.mock('../../../../../UI/SelectComponent', () => {
  const ReactLib = jest.requireActual('react');
  const { View, Text, TouchableOpacity } = jest.requireActual('react-native');
  return ({
    onValueChange,
    selectedValue,
    label,
  }: {
    onValueChange: (v: string) => void;
    selectedValue: string;
    label: string;
  }) =>
    ReactLib.createElement(
      View,
      { testID: 'select-component' },
      ReactLib.createElement(Text, null, label),
      ReactLib.createElement(Text, { testID: 'selected-value' }, selectedValue),
      ReactLib.createElement(
        TouchableOpacity,
        {
          testID: 'change-value-button',
          onPress: () => onValueChange('10000'),
        },
        ReactLib.createElement(Text, null, 'change'),
      ),
    );
});

const buildState = (lockTime: number) => ({
  engine: { backgroundState },
  settings: { lockTime },
});

describe('AutoLock', () => {
  it('renders correctly', () => {
    const { toJSON, getByTestId } = renderWithProvider(<AutoLock />, {
      state: buildState(30000),
    });
    expect(getByTestId(AUTO_LOCK_SECTION)).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it('passes the current lockTime to the select component as a string', () => {
    const { getByTestId } = renderWithProvider(<AutoLock />, {
      state: buildState(60000),
    });
    expect(getByTestId('selected-value').props.children).toBe('60000');
  });

  it('dispatches setLockTime when a new value is selected', () => {
    (setLockTime as jest.Mock).mockClear();
    const { getByTestId } = renderWithProvider(<AutoLock />, {
      state: buildState(30000),
    });

    fireEvent.press(getByTestId('change-value-button'));

    expect(setLockTime).toHaveBeenCalledWith(10000);
  });
});
