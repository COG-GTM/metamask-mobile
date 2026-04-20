import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import renderWithProvider from '../../../../../util/test/renderWithProvider';

jest.mock('react-native-modal', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ children, isVisible }: any) =>
    isVisible ? <View>{children}</View> : null;
});

// eslint-disable-next-line import/first
import FiatSelectModal from './FiatSelectModal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const currencies: any[] = [
  { id: '/currencies/fiat/usd', symbol: 'USD', name: 'US Dollar' },
  { id: '/currencies/fiat/eur', symbol: 'EUR', name: 'Euro' },
  { id: '/currencies/fiat/gbp', symbol: 'GBP', name: 'British Pound' },
];

describe('FiatSelectModal', () => {
  it('does not render any rows when hidden', () => {
    const { queryByText } = renderWithProvider(
      <FiatSelectModal
        isVisible={false}
        dismiss={jest.fn()}
        currencies={currencies}
        onItemPress={jest.fn()}
      />,
    );
    expect(queryByText('US Dollar')).toBeNull();
  });

  it('renders the full list of non-excluded currencies', () => {
    const { getByText, queryByText, toJSON } = renderWithProvider(
      <FiatSelectModal
        isVisible
        dismiss={jest.fn()}
        currencies={currencies}
        onItemPress={jest.fn()}
        excludeIds={['/currencies/fiat/gbp']}
      />,
    );
    expect(getByText('US Dollar')).toBeDefined();
    expect(getByText('Euro')).toBeDefined();
    expect(queryByText('British Pound')).toBeNull();
    expect(toJSON()).toMatchSnapshot();
  });

  it('invokes onItemPress with the tapped currency', () => {
    const onItemPress = jest.fn();
    const { getByText } = renderWithProvider(
      <FiatSelectModal
        isVisible
        dismiss={jest.fn()}
        currencies={currencies}
        onItemPress={onItemPress}
      />,
    );
    fireEvent.press(getByText('Euro'));
    expect(onItemPress).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: 'EUR' }),
    );
  });
});
