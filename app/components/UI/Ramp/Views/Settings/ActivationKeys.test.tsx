import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import renderWithProvider from '../../../../../util/test/renderWithProvider';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualReactNavigation = jest.requireActual(
    '@react-navigation/native',
  );
  return {
    ...actualReactNavigation,
    useNavigation: () => ({ navigate: mockNavigate }),
  };
});

jest.mock('../../sdk', () => ({
  useRampSDK: () => ({ isInternalBuild: true }),
}));

const mockAddActivationKey = jest.fn();
const mockUpdateActivationKey = jest.fn();
const mockRemoveActivationKey = jest.fn();
let mockIsLoading = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockKeys: any[] = [];

jest.mock('../../hooks/useActivationKeys', () => () => ({
  isLoadingKeys: mockIsLoading,
  activationKeys: mockKeys,
  updateActivationKey: mockUpdateActivationKey,
  addActivationKey: mockAddActivationKey,
  removeActivationKey: mockRemoveActivationKey,
}));

// eslint-disable-next-line import/first
import ActivationKeys from './ActivationKeys';

describe('ActivationKeys', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockAddActivationKey.mockClear();
    mockUpdateActivationKey.mockClear();
    mockRemoveActivationKey.mockClear();
    mockIsLoading = false;
    mockKeys = [];
  });

  it('renders an empty list with an add button', () => {
    const { toJSON } = renderWithProvider(<ActivationKeys />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('navigates to the new-key form when the add button is pressed', () => {
    const { getByText } = renderWithProvider(<ActivationKeys />);
    fireEvent.press(getByText('Add Activation Key'));
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('renders the list of activation keys and allows removal and editing', () => {
    mockKeys = [
      { key: 'abc', label: 'My key', active: true },
      { key: 'def', label: '', active: false },
    ];
    const { getByText, getAllByLabelText } = renderWithProvider(
      <ActivationKeys />,
    );
    expect(getByText('My key')).toBeDefined();
    expect(getByText('abc')).toBeDefined();
    expect(getByText('def')).toBeDefined();

    const editButtons = getAllByLabelText('Edit Activation Key');
    fireEvent.press(editButtons[0]);
    expect(mockNavigate).toHaveBeenCalled();

    const deleteButtons = getAllByLabelText('Delete Activation Key');
    fireEvent.press(deleteButtons[0]);
    expect(mockRemoveActivationKey).toHaveBeenCalledWith('abc');
  });
});
