import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import TokenDetailsListItem from './TokenDetailsListItem';

describe('TokenDetailsListItem', () => {
  it('renders the label and value and matches snapshot', () => {
    const { getByText, toJSON } = render(
      <TokenDetailsListItem label="Market Cap" value="$1B" style={{}} />,
    );

    expect(getByText('Market Cap')).toBeDefined();
    expect(getByText('$1B')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the value when given a numeric value', () => {
    const { getByText } = render(
      <TokenDetailsListItem label="Rank" value={42} style={{}} />,
    );

    expect(getByText('42')).toBeDefined();
  });

  it('renders children in place of the default value text when provided', () => {
    const { getByText, queryByText } = render(
      <TokenDetailsListItem label="Volume" value="$1M" style={{}}>
        <Text>custom child</Text>
      </TokenDetailsListItem>,
    );

    expect(getByText('custom child')).toBeDefined();
    expect(queryByText('$1M')).toBeNull();
  });
});
