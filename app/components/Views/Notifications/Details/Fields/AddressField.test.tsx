/* eslint-disable import/no-namespace */
import React from 'react';
import { Pressable } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import AddressField from './AddressField';
import { ModalFieldType } from '../../../../../util/notifications';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import * as useCopyClipboardModule from '../hooks/useCopyClipboard';

jest.mock('../hooks/useCopyClipboard', () => {
  const actual = jest.requireActual('../hooks/useCopyClipboard');
  return {
    __esModule: true,
    ...actual,
    default: jest.fn(),
  };
});

describe('AddressField', () => {
  const baseProps = {
    type: ModalFieldType.ADDRESS as const,
    label: 'From',
    address: '0x1234567890abcdef1234567890abcdef12345678',
  };

  const mockCopy = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(useCopyClipboardModule, 'default')
      .mockReturnValue(mockCopy as unknown as ReturnType<
        typeof useCopyClipboardModule.default
      >);
  });

  it('renders correctly with JazzIcon by default', () => {
    const { toJSON } = renderWithProvider(<AddressField {...baseProps} />, {
      state: { settings: { useBlockieIcon: false } },
    });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the label passed via props', () => {
    const { getByText } = renderWithProvider(<AddressField {...baseProps} />, {
      state: { settings: { useBlockieIcon: false } },
    });
    expect(getByText('From')).toBeDefined();
  });

  it('copies the address to clipboard when the pressable is pressed', () => {
    const { UNSAFE_getAllByType } = renderWithProvider(
      <AddressField {...baseProps} />,
      { state: { settings: { useBlockieIcon: false } } },
    );
    const pressables = UNSAFE_getAllByType(Pressable);
    expect(pressables.length).toBeGreaterThan(0);
    fireEvent.press(pressables[0]);
    expect(mockCopy).toHaveBeenCalledWith(
      baseProps.address,
      expect.any(String),
    );
  });

  it('renders the Blockies avatar when useBlockieIcon is true', () => {
    const { toJSON } = renderWithProvider(<AddressField {...baseProps} />, {
      state: { settings: { useBlockieIcon: true } },
    });
    expect(toJSON()).toBeTruthy();
  });
});
