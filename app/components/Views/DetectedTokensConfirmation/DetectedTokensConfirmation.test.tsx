import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import DetectedTokensConfirmation from './index';
import { backgroundState } from '../../../util/test/initial-root-state';

jest.mock('../../UI/ReusableModal', () => {
  const { forwardRef } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: forwardRef(({ children }: { children: React.ReactNode }, _ref: React.Ref<unknown>) => (
      <View>{children}</View>
    )),
  };
});

const initialState = {
  engine: {
    backgroundState,
  },
};

describe('DetectedTokensConfirmation', () => {
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders import confirmation correctly', () => {
    const mockRoute = {
      params: {
        onConfirm: mockOnConfirm,
        isHidingAll: false,
      },
    };
    const { toJSON } = renderWithProvider(
      <DetectedTokensConfirmation route={mockRoute} />,
      { state: initialState },
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders hide confirmation correctly', () => {
    const mockRoute = {
      params: {
        onConfirm: mockOnConfirm,
        isHidingAll: true,
      },
    };
    const { toJSON } = renderWithProvider(
      <DetectedTokensConfirmation route={mockRoute} />,
      { state: initialState },
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders cancel and confirm buttons', () => {
    const mockRoute = {
      params: {
        onConfirm: mockOnConfirm,
        isHidingAll: false,
      },
    };
    const { getByText } = renderWithProvider(
      <DetectedTokensConfirmation route={mockRoute} />,
      { state: initialState },
    );
    expect(getByText('Cancel')).toBeDefined();
    expect(getByText('Confirm')).toBeDefined();
  });
});
