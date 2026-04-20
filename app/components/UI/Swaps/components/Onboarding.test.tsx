/* eslint-disable react/jsx-pascal-case, react/prop-types, @typescript-eslint/no-unused-vars, @typescript-eslint/no-require-imports, import/no-commonjs */
import React from 'react';
import { fireEvent } from '@testing-library/react-native';

jest.mock('../../StyledButton', () => {
  const RN = jest.requireActual('react-native');
  const StyledButton = ({
    children,
    onPress,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
  }) => (
    <RN.TouchableOpacity onPress={onPress}>
      <RN.Text>{children}</RN.Text>
    </RN.TouchableOpacity>
  );
  return { __esModule: true, default: StyledButton };
});

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate }),
  };
});

import renderWithProvider from '../../../../util/test/renderWithProvider';
import Onboarding from './Onboarding';

describe('Onboarding', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('matches the snapshot', () => {
    const { toJSON } = renderWithProvider(
      <Onboarding setHasOnboarded={jest.fn()} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('calls setHasOnboarded(true) when the start swapping button is pressed', () => {
    const setHasOnboarded = jest.fn();
    const { getByText } = renderWithProvider(
      <Onboarding setHasOnboarded={setHasOnboarded} />,
    );
    fireEvent.press(getByText(/start swapping/i));
    expect(setHasOnboarded).toHaveBeenCalledWith(true);
  });

  it('navigates to the audits webview when the review audits link is pressed', () => {
    const { getByText } = renderWithProvider(
      <Onboarding setHasOnboarded={jest.fn()} />,
    );
    fireEvent.press(getByText(/review our official contracts audit/i));
    expect(mockNavigate).toHaveBeenCalledWith('Webview', expect.any(Object));
  });
});
