/* eslint-disable react/jsx-pascal-case, react/prop-types, @typescript-eslint/no-unused-vars, @typescript-eslint/no-require-imports, import/no-commonjs */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('react-native-modal', () => {
  const RN = jest.requireActual('react-native');
  const MockModal = ({ isVisible, children }) =>
    isVisible ? <RN.View testID="modal">{children}</RN.View> : null;
  return { __esModule: true, default: MockModal };
});

jest.mock('../../StyledButton', () => {
  const RN = jest.requireActual('react-native');
  const StyledButton = ({ children, onPress }) => (
    <RN.TouchableOpacity testID="styled-button" onPress={onPress}>
      <RN.Text>{children}</RN.Text>
    </RN.TouchableOpacity>
  );
  return { __esModule: true, default: StyledButton };
});

jest.mock('./TokenIcon', () => {
  const RN = jest.requireActual('react-native');
  return { __esModule: true, default: () => <RN.View testID="token-icon" /> };
});

import TokenImportModal from './TokenImportModal';

const token = {
  address: '0xabc',
  name: 'MyToken',
  symbol: 'MTK',
  decimals: 18,
  iconUrl: 'http://example/icon.png',
};

describe('TokenImportModal', () => {
  it('matches the snapshot', () => {
    const { toJSON } = render(
      <TokenImportModal
        isVisible
        dismiss={jest.fn()}
        token={token}
        onPressImport={jest.fn()}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the token name and symbol when both are provided', () => {
    const { getByText } = render(
      <TokenImportModal
        isVisible
        dismiss={jest.fn()}
        token={token}
        onPressImport={jest.fn()}
      />,
    );
    expect(getByText('MyToken (MTK)')).toBeTruthy();
    expect(getByText('0xabc')).toBeTruthy();
  });

  it('falls back to symbol when name is missing', () => {
    const { getByText } = render(
      <TokenImportModal
        isVisible
        dismiss={jest.fn()}
        token={{ ...token, name: undefined }}
        onPressImport={jest.fn()}
      />,
    );
    expect(getByText('MTK')).toBeTruthy();
  });

  it('calls onPressImport when the import button is pressed', () => {
    const onPressImport = jest.fn();
    const { getByTestId } = render(
      <TokenImportModal
        isVisible
        dismiss={jest.fn()}
        token={token}
        onPressImport={onPressImport}
      />,
    );
    fireEvent.press(getByTestId('styled-button'));
    expect(onPressImport).toHaveBeenCalled();
  });

  it('does not render when not visible', () => {
    const { queryByTestId } = render(
      <TokenImportModal
        isVisible={false}
        dismiss={jest.fn()}
        token={token}
        onPressImport={jest.fn()}
      />,
    );
    expect(queryByTestId('modal')).toBeNull();
  });
});
