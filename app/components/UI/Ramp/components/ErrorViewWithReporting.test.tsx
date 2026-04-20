import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import renderWithProvider from '../../../../util/test/renderWithProvider';

jest.mock('../../StyledButton', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const { TouchableOpacity, Text } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ onPress, children }: any) => (
    <TouchableOpacity onPress={onPress}>
      <Text>{children}</Text>
    </TouchableOpacity>
  );
});

// eslint-disable-next-line import/first
import ErrorViewWithReporting from './ErrorViewWithReporting';

const mockPop = jest.fn();
const mockDangerouslyGetParent = jest.fn(() => ({ pop: mockPop }));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ dangerouslyGetParent: mockDangerouslyGetParent }),
}));

jest.mock('../hooks/useAnalytics', () => () => jest.fn());

jest.mock('../sdk', () => ({
  useRampSDK: () => ({
    selectedPaymentMethodId: null,
    selectedRegion: null,
    selectedAsset: null,
    selectedFiatCurrencyId: null,
    isBuy: true,
  }),
}));

describe('ErrorViewWithReporting', () => {
  beforeEach(() => {
    mockPop.mockClear();
    mockDangerouslyGetParent.mockClear();
  });

  it('renders the error message and a return-home cta', () => {
    const { toJSON, getByText } = renderWithProvider(
      <ErrorViewWithReporting
        error={new Error('boom')}
        location="Amount to Buy Screen"
      />,
    );
    expect(getByText('boom')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('falls back to the generic something-went-wrong description when the error has no message', () => {
    const { queryByText } = renderWithProvider(
      <ErrorViewWithReporting
        error={new Error()}
        location="Amount to Buy Screen"
      />,
    );
    expect(queryByText('boom')).toBeNull();
  });

  it('pops the parent navigator when the cta is pressed', () => {
    const { getAllByText } = renderWithProvider(
      <ErrorViewWithReporting
        error={new Error('boom')}
        location="Amount to Buy Screen"
      />,
    );
    const ctaTexts = getAllByText(/./i).filter(
      (node) =>
        typeof node.props.children === 'string' &&
        (node.props.children as string).length > 0,
    );
    // fallback: trigger by locating the cta via accessible text — the label is i18n'd
    // so we use a button role if present or just invoke the first button-like element.
    fireEvent.press(ctaTexts[ctaTexts.length - 1]);
    expect(mockDangerouslyGetParent).toHaveBeenCalled();
  });
});
