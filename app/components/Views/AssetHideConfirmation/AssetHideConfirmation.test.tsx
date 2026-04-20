import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import AssetHideConfirmation from './index';
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

describe('AssetHideConfirmation', () => {
  const mockOnConfirm = jest.fn();
  const mockRoute = {
    params: {
      onConfirm: mockOnConfirm,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { toJSON } = renderWithProvider(
      <AssetHideConfirmation route={mockRoute} />,
      { state: initialState },
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders header and description text', () => {
    const { getByText } = renderWithProvider(
      <AssetHideConfirmation route={mockRoute} />,
      { state: initialState },
    );
    expect(getByText('Hide token')).toBeDefined();
  });

  it('renders cancel and confirm buttons', () => {
    const { getByText } = renderWithProvider(
      <AssetHideConfirmation route={mockRoute} />,
      { state: initialState },
    );
    expect(getByText('Cancel')).toBeDefined();
    expect(getByText('Confirm')).toBeDefined();
  });
});
